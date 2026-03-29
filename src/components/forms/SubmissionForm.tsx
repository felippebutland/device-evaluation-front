import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '@/hooks/useAuth';
import { useToastContext } from '@/hooks/useToast';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import {
    anonymousSubmissionSchema,
    authenticatedSubmissionSchema,
    type AnonymousSubmissionForm,
    type AuthenticatedSubmissionForm
} from '@/utils/validation';
import { SALE_MODES } from '@/utils/constants';
import { submissionService } from '@/services/submission.service';
import { deviceService } from '@/services/device.service';
import { useApi } from '@/hooks/useApi';
import { formatPhone } from '@/utils/helpers';
import type { Device, PricingPolicy } from '@/types';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import logoSrc from '../layout/logo-preta.png';

// Tipo para variante do dispositivo
interface DeviceVariant {
    _id?: string;
    id?: string;
    model: string;
    memory: string;
    price: number;
    sku?: string;
    isActive?: boolean;
}

interface SubmissionFormProps {
    device?: Device;
    onSuccess?: (trackingCode: string) => void;
    onCancel?: () => void;
}

export function SubmissionForm({ device, onSuccess, onCancel }: SubmissionFormProps) {
    const { isAuthenticated } = useAuth();
    const { success, error: showError } = useToastContext();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);

    const [selectedDevice, setSelectedDevice] = useState<Device | null>(device || null);
    const [selectedVariant, setSelectedVariant] = useState<DeviceVariant | null>(null);
    const [selectedPaymentTiming, setSelectedPaymentTiming] = useState<string>('');
    const isAnonymous = !isAuthenticated;

    // Theme
    const [isDark, setIsDark] = useState(true);

    // Export modal
    const [isExportModalOpen, setIsExportModalOpen] = useState(false);
    const [exportSeller, setExportSeller] = useState({ name: '', phone: '', email: '' });
    const [isExporting, setIsExporting] = useState(false);
    const exportRef = useRef<HTMLDivElement>(null);

    // Função para formatar valores em moeda brasileira
    const formatCurrency = (value: number): string => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(value);
    };

    // Mapeamento de payment timing para labels
    const paymentTimingOptions = [
        { value: 'seven_days', label: '7 dias' },
        { value: 'ten_days', label: '10 dias' },
        { value: 'fifteen_days', label: '15 dias' },
        { value: 'thirty_days', label: '30 dias' }
    ];

    // Definir etapas do processo baseado no tipo de usuário
    const getSteps = () => {
        const baseSteps = [
            { id: 1, name: 'Detalhes', description: 'Informações do dispositivo' }
        ];

        // if (isAnonymous) {
        //     baseSteps.push({ id: 2, name: 'Contato', description: 'Dados para contato' });
        // }

        // baseSteps.push({ id: baseSteps.length + 1, name: 'Confirmação', description: 'Revisão final' });
        return baseSteps;
    };

    const steps = getSteps();

    // Load devices for selection when no device is provided
    const {  data: devicesData, loading: devicesLoading, error: devicesError } = useApi(
        () => deviceService.getPublicDevices({ limit: 100 }),
        []
    );

    // Load pricing policies
    const {  data: pricingPoliciesData, loading: pricingLoading, error: pricingError } = useApi(
        async () => {
            try {
                const result = await deviceService.getPricingPolicies();
                return result;
            } catch (error) {
                throw error;
            }
        },
        []
    );

    // Anonymous form
    const anonymousForm = useForm<AnonymousSubmissionForm & { paymentTiming?: string; batteryPercentage?: number; variantId?: string }>({
        resolver: zodResolver(anonymousSubmissionSchema),
        defaultValues: {
            deviceId: device?.id || '',
            variantId: '',
            reportedCondition: 'good',
            preferredSaleMode: 'sale',
            applicableDamageTypes: [],
            paymentTiming: '',
            batteryPercentage: undefined
        }
    });

    // Authenticated form
    const authenticatedForm = useForm<AuthenticatedSubmissionForm & { paymentTiming?: string; batteryPercentage?: number; variantId?: string }>({
        resolver: zodResolver(authenticatedSubmissionSchema),
        defaultValues: {
            deviceId: device?.id || '',
            variantId: '',
            reportedCondition: 'good',
            preferredSaleMode: 'sale',
            applicableDamageTypes: [],
            paymentTiming: '',
            batteryPercentage: undefined
        }
    });

    const form = isAnonymous ? anonymousForm : authenticatedForm;

    // Usar form.watch para observar mudanças
    const preferredSaleMode = form.watch('preferredSaleMode');
    const selectedDamageIds = form.watch('applicableDamageTypes') || [];

    // Verificar se algum dano selecionado bloqueia a submissão
    const blockingDamage = useMemo(() => {
        if (!selectedDevice?.applicableDamageTypes || selectedDamageIds.length === 0) return null;
        return selectedDevice.applicableDamageTypes.find((adt: any) => {
            const adtId = adt.id || adt._id;
            const blocks = adt.blocksSubmission ?? adt.damageType?.blocksSubmission ?? false;
            return selectedDamageIds.includes(adtId) && blocks;
        }) || null;
    }, [selectedDevice, selectedDamageIds]);

    // Filtrar políticas ativas e de venda
    const activeSalePolicies = useMemo(() => {
        if (!pricingPoliciesData) return [];
        const list = Array.isArray(pricingPoliciesData)
            ? pricingPoliciesData
            : (pricingPoliciesData as any)?.data ?? [];

        return list
            .filter((policy: PricingPolicy) => policy.isActive && policy.saleMode === 'sale')
            .sort((a: PricingPolicy, b: PricingPolicy) => a.priority - b.priority);
    }, [pricingPoliciesData]);

    // Estado para controlar a porcentagem da bateria
    const [batteryPercentage, setBatteryPercentage] = useState<number>(0);
    const [selectedConservationStateId, setSelectedConservationStateId] = useState<string>('');

    // Reset payment timing quando modalidade mudar
    useEffect(() => {
        setSelectedPaymentTiming('');
        form.setValue('paymentTiming', '');
    }, [preferredSaleMode]);

    // Função para determinar política de bateria baseada na porcentagem
    const getBatteryPolicy = useMemo(() => {
        if (!selectedDevice || !selectedDevice.applicableDamageTypes || selectedDevice.applicableDamageTypes.length === 0) {
            return null;
        }

        if (batteryPercentage <= 0) return null;

        const batteryDamageTypes = selectedDevice.applicableDamageTypes.filter((adt: any) => {
            const name = adt.damageType?.name?.toLowerCase() || '';
            return name.includes('bateria') || name.includes('battery');
        });

        if (batteryDamageTypes.length === 0) {
            return null;
        }

        // Extrai o primeiro número do nome para usar como threshold mínimo
        // Ex: "Bateria 99%" → 99, "Bateria 80%" → 80
        const withThreshold = batteryDamageTypes.map((adt: any) => {
            const name = adt.damageType?.name || '';
            const match = name.match(/(\d+)/);
            const threshold = match ? parseInt(match[1], 10) : 0;
            return { adt, threshold };
        });

        // Ordena do maior threshold para o menor
        withThreshold.sort((a: any, b: any) => b.threshold - a.threshold);

        // Pega a primeira política cujo threshold seja <= batteryPercentage
        const match = withThreshold.find((item: any) => batteryPercentage >= item.threshold);
        if (match) return match.adt;

        // Fallback: política com menor threshold
        return withThreshold[withThreshold.length - 1]?.adt || null;

        return null;
    }, [selectedDevice, batteryPercentage]);

    // Calcular desconto da política de preço baseado no payment timing selecionado
    const policyDiscount = useMemo(() => {
        if (!selectedPaymentTiming) {
            return 0;
        }

        if (!selectedDevice || !(selectedDevice as any).specificPricingPolicies) {
            return 0;
        }

        // Buscar desconto nas políticas específicas do dispositivo
        // A API pode retornar estrutura aninhada (policy.pricingPolicy.*) ou flat
        const selectedPolicy = (selectedDevice as any).specificPricingPolicies.find((policy: any) => {
            const timing = policy.paymentTiming || policy.pricingPolicy?.paymentTiming || '';
            const mode = policy.saleMode || policy.pricingPolicy?.saleMode || '';
            return timing === selectedPaymentTiming && mode === preferredSaleMode;
        });

        if (!selectedPolicy) return 0;
        return selectedPolicy.discountAmount ?? selectedPolicy.pricingPolicy?.discountAmount ?? 0;
    }, [selectedPaymentTiming, preferredSaleMode, selectedDevice]);

    // Calcular desconto da política de bateria
    const batteryPolicyDiscount = useMemo(() => {
        if (preferredSaleMode !== 'sale') {
            return 0;
        }

        const batteryPolicy = getBatteryPolicy;
        if (!batteryPolicy || !selectedVariant?.price) {
            return 0;
        }

        // defaultDiscountPercentage é valor fixo em R$, não porcentagem
        const discountAmount = batteryPolicy.defaultDiscountPercentage || 0;
        return discountAmount;
    }, [getBatteryPolicy, preferredSaleMode, selectedVariant?.price]);

    // Calcular precificação baseada na variante selecionada
    const calculatedPricing = useMemo(() => {
        if (!selectedDevice || !selectedVariant || !selectedVariant.price) {
            return {
                originalPrice: 0,
                damageDiscount: 0,
                damageItems: [],
                conservationDiscount: 0,
                policyDiscount: 0,
                batteryPolicyDiscount: 0,
                totalDiscount: 0,
                finalPrice: 0,
                discountPercentage: 0
            };
        }

        const originalPrice = parseFloat(selectedVariant.price.toString());
        let damageDiscountAmount = 0;
        const damageItems: { name: string; amount: number; isAdd: boolean }[] = [];

        // Aplicar descontos de dano para venda e troca
        if (selectedDevice.applicableDamageTypes) {
            selectedDevice.applicableDamageTypes.forEach((adt: any) => {
                const adtId = adt.id || adt._id;
                if (selectedDamageIds.includes(adtId) && typeof adt.defaultDiscountPercentage === 'number') {
                    const operation = adt.operation || adt.damageType?.operation || 'subtract';
                    const isAdd = operation === 'add';
                    const name = adt.damageType?.name || adt.name || 'Condição';
                    if (isAdd) {
                        damageDiscountAmount -= adt.defaultDiscountPercentage;
                    } else {
                        damageDiscountAmount += adt.defaultDiscountPercentage;
                    }
                    damageItems.push({ name, amount: adt.defaultDiscountPercentage, isAdd });
                }
            });
        }

        // Desconto por estado de conservação
        let conservationDiscountAmount = 0;
        if (selectedConservationStateId && (selectedDevice as any).applicableConservationStates) {
            const acs = (selectedDevice as any).applicableConservationStates.find((cs: any) => {
                const csId = cs.id || cs._id;
                const refId = cs.conservationState?._id || cs.conservationState?.id || csId;
                return String(refId) === String(selectedConservationStateId) || String(csId) === String(selectedConservationStateId);
            });
            if (acs && typeof acs.value === 'number') {
                const op = acs.operation || acs.conservationState?.operation || 'subtract';
                if (op === 'add') {
                    conservationDiscountAmount -= acs.value;
                } else {
                    conservationDiscountAmount += acs.value;
                }
            }
        }

        // Considerar desconto de política para qualquer modalidade; bateria só para venda
        const effectivePolicyDiscount = policyDiscount;
        const effectiveBatteryDiscount = preferredSaleMode === 'sale' ? batteryPolicyDiscount : 0;

        const totalDiscountAmount = damageDiscountAmount + conservationDiscountAmount + effectivePolicyDiscount + effectiveBatteryDiscount;
        const finalPrice = Math.max(0, originalPrice - totalDiscountAmount);
        // Percentual absoluto (positivo = desconto, negativo = acréscimo)
        const discountPercentage = originalPrice > 0 ? (Math.abs(totalDiscountAmount) / originalPrice) * 100 : 0;

        return {
            originalPrice,
            damageDiscount: damageDiscountAmount,
            damageItems,
            conservationDiscount: conservationDiscountAmount,
            policyDiscount: effectivePolicyDiscount,
            batteryPolicyDiscount: effectiveBatteryDiscount,
            totalDiscount: totalDiscountAmount,
            finalPrice,
            discountPercentage: Math.min(100, discountPercentage)
        };
    }, [selectedDevice, selectedVariant, selectedDamageIds, selectedConservationStateId, policyDiscount, batteryPolicyDiscount, preferredSaleMode]);

    useEffect(() => {
        form.setValue('deviceId', selectedDevice ? String(selectedDevice.id) : '');
        form.setValue('variantId', selectedVariant?._id || selectedVariant?.id || '');
        form.setValue('applicableDamageTypes', []);
        setSelectedConservationStateId('');

        // Reset variant when device changes
        if (selectedDevice) {
            setSelectedVariant(null);
        }
    }, [selectedDevice]);

    // Update form when variant changes
    useEffect(() => {
        form.setValue('variantId', selectedVariant?._id || selectedVariant?.id || '');
    }, [selectedVariant]);

    // Handle device selection
    const handleDeviceSelect = (deviceId: string) => {
        const devicesList = Array.isArray(devicesData) ? devicesData : (devicesData as any)?.data ?? [];
        const device = devicesList.find((d: any) => String(d.id) === String(deviceId)) || null;
        setSelectedDevice(device);
        setSelectedVariant(null);
    };

    // Handle variant selection
    const handleVariantSelect = (variantId: string) => {
        if (!selectedDevice || !selectedDevice.variants) return;
        const variant = selectedDevice.variants.find((v: any) => String(v._id || v.id) === String(variantId)) || null;
        setSelectedVariant(variant);
    };

    const onSubmit = async ( any) => {
        setIsSubmitting(true);
        try {
            let result;

            const submissionData = {
                ...data,
                deviceId: selectedDevice?._id,
                variantId: selectedVariant?._id || selectedVariant?.id,
                paymentTiming: selectedPaymentTiming || undefined
            };

            const formattedData = {
                ...submissionData,
            };
            result = await submissionService.submitAnonymous(formattedData);

            success(
                'Submissão enviada com sucesso!',
                `Código de rastreamento: ${result.trackingCode}`
            );

            onSuccess?.(result.trackingCode);
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Erro ao enviar submissão';
            showError('Erro na submissão', message);
        } finally {
            setIsSubmitting(false);
        }
    };

    // const StepIndicator = () => (
    //     <div className="w-full bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8">
    //         <div className="flex items-center justify-between relative">
    //             <div className="absolute top-6 left-0 right-0 h-0.5 bg-gray-200 z-0"></div>
    //             <div
    //                 className="absolute top-6 left-0 h-0.5 bg-gradient-to-r from-blue-500 to-purple-600 z-10 transition-all duration-500 ease-in-out"
    //                 style={{ width: `${(currentStep / (steps.length - 1)) * 100}%` }}
    //             ></div>

    //             {steps.map((step, index) => (
    //                 <div key={step.id} className="flex flex-col items-center relative z-20">
    //                     <div className={`
    //           w-12 h-12 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300
    //           ${index <= currentStep
    //                             ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
    //                             : 'bg-white border-2 border-gray-300 text-gray-400'
    //                         }
    //         `}>
    //                         {index < currentStep ? (
    //                             <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
    //                                 <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
    //                             </svg>
    //                         ) : (
    //                             index + 1
    //                         )}
    //                     </div>
    //                     <div className="mt-3 text-center">
    //                         <div className={`text-sm font-medium ${index <= currentStep ? 'text-gray-900' : 'text-gray-400'}`}>
    //                             {step.name}
    //                         </div>
    //                         <div className={`text-xs mt-1 ${index <= currentStep ? 'text-gray-600' : 'text-gray-400'}`}>
    //                             {step.description}
    //                         </div>
    //                     </div>
    //                 </div>
    //             ))}
    //         </div>
    //     </div>
    // );

    // Exportar calculadora como PDF
    const handleExport = async () => {
        if (!exportRef.current) return;
        setIsExporting(true);
        try {
            const canvas = await html2canvas(exportRef.current, { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
            const pageWidth = pdf.internal.pageSize.getWidth();
            const imgWidth = pageWidth - 20;
            const imgHeight = (canvas.height * imgWidth) / canvas.width;
            pdf.addImage(imgData, 'PNG', 10, 10, imgWidth, imgHeight);
            pdf.save(`orcamento-${selectedDevice?.name || 'dispositivo'}-${Date.now()}.pdf`);
            setIsExportModalOpen(false);
        } finally {
            setIsExporting(false);
        }
    };

    // Componente de Calculadora de Preço
    const t = isDark ? {
        pageBg: '#000000',
        cardBg: 'rgba(255,255,255,0.04)',
        cardBorder: '1px solid rgba(255,255,255,0.10)',
        cardShadow: '0 12px 30px rgba(0,0,0,0.45)',
        text: '#e9ecf5',
        muted: '#a8adbb',
        divider: 'rgba(255,255,255,0.08)',
        stepCircleBg: 'rgba(255,255,255,0.07)',
        selectBg: 'rgba(255,255,255,0.05)',
        selectBorder: '1px solid rgba(255,255,255,0.16)',
        chipBg: 'rgba(255,255,255,0.02)',
        chipBorder: '1px solid rgba(255,255,255,0.06)',
        chipSelectedBg: 'rgba(255,255,255,0.08)',
        chipSelectedBorder: '1px solid rgba(255,255,255,0.25)',
        badgeBorder: 'rgba(255,255,255,0.10)',
        btnBg: '#ffffff',
        btnText: '#0b0c10',
        tableBorderColor: 'rgba(255,255,255,0.08)',
    } : {
        pageBg: '#f5f5f7',
        cardBg: '#ffffff',
        cardBorder: '1px solid rgba(0,0,0,0.10)',
        cardShadow: '0 4px 20px rgba(0,0,0,0.08)',
        text: '#1c1c1e',
        muted: '#6b7280',
        divider: 'rgba(0,0,0,0.08)',
        stepCircleBg: 'rgba(0,0,0,0.06)',
        selectBg: '#f9fafb',
        selectBorder: '1px solid rgba(0,0,0,0.16)',
        chipBg: 'rgba(0,0,0,0.02)',
        chipBorder: '1px solid rgba(0,0,0,0.08)',
        chipSelectedBg: 'rgba(0,0,0,0.06)',
        chipSelectedBorder: '1px solid rgba(0,0,0,0.30)',
        badgeBorder: 'rgba(0,0,0,0.10)',
        btnBg: '#1c1c1e',
        btnText: '#ffffff',
        tableBorderColor: 'rgba(0,0,0,0.08)',
    };

    const cardStyle: React.CSSProperties = {
        background: t.cardBg,
        border: t.cardBorder,
        borderRadius: '20px',
        boxShadow: t.cardShadow,
        padding: '20px',
    };
    const labelStyle: React.CSSProperties = {
        display: 'block', fontWeight: 900, fontSize: '13px',
        color: t.text, margin: '12px 0 8px',
    };
    const selectStyle: React.CSSProperties = {
        width: '100%', padding: '12px', borderRadius: '14px',
        border: t.selectBorder,
        background: t.selectBg, color: t.text,
        outline: 'none', fontSize: '15px',
    };

    const tdStyle = (extra?: React.CSSProperties): React.CSSProperties => ({
        padding: '8px 6px', borderBottom: `1px solid ${t.tableBorderColor}`,
        fontSize: '13px', color: t.text, ...extra,
    });

    const PriceCalculator = () => (
        <div style={{ ...cardStyle, position: 'sticky', top: '16px' }}>
            {/* Resultado */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                <div>
                    <p style={{ color: t.muted, fontWeight: 900, fontSize: '12px', marginBottom: '6px' }}>RESULTADO</p>
                    <p style={{ fontSize: '30px', fontWeight: 1000, letterSpacing: '-0.02em', color: t.text, lineHeight: 1 }}>
                        {calculatedPricing.originalPrice > 0 ? formatCurrency(calculatedPricing.finalPrice) : '—'}
                    </p>
                </div>
                {calculatedPricing.originalPrice > 0 && (
                    blockingDamage ? (
                        <span style={{ padding: '6px 10px', borderRadius: '999px', fontWeight: 900, fontSize: '12px', color: '#ff4d4d', border: '1px solid rgba(255,77,77,0.35)', background: 'rgba(255,77,77,0.08)' }}>
                            ❌ REPROVADO
                        </span>
                    ) : (
                        <span style={{ padding: '6px 10px', borderRadius: '999px', fontWeight: 900, fontSize: '12px', color: '#18a957', border: '1px solid rgba(24,169,87,0.35)', background: 'rgba(24,169,87,0.08)' }}>
                            APROVADO
                        </span>
                    )
                )}
            </div>

            {/* Breakdown */}
            {calculatedPricing.originalPrice > 0 && (
                <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '8px' }}>
                    <tbody>
                        {selectedVariant && (
                            <tr>
                                <td style={tdStyle()}>Base — {selectedVariant.model} {selectedVariant.memory}</td>
                                <td style={tdStyle({ color: t.muted, textAlign: 'right', whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' })}>
                                    {formatCurrency(calculatedPricing.originalPrice)}
                                </td>
                            </tr>
                        )}
                        {calculatedPricing.damageItems?.map((item, idx) => (
                            <tr key={idx}>
                                <td style={tdStyle()}>{item.name}</td>
                                <td style={tdStyle({ color: item.isAdd ? '#18a957' : '#ff4d4d', textAlign: 'right', whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' })}>
                                    {item.isAdd ? '+' : '-'}{formatCurrency(item.amount)}
                                </td>
                            </tr>
                        ))}
                        {calculatedPricing.conservationDiscount !== 0 && (
                            <tr>
                                <td style={tdStyle()}>Conservação</td>
                                <td style={tdStyle({ color: calculatedPricing.conservationDiscount > 0 ? '#ff4d4d' : '#18a957', textAlign: 'right', whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' })}>
                                    {calculatedPricing.conservationDiscount > 0 ? '-' : '+'}{formatCurrency(Math.abs(calculatedPricing.conservationDiscount))}
                                </td>
                            </tr>
                        )}
                        {calculatedPricing.batteryPolicyDiscount > 0 && (
                            <tr>
                                <td style={tdStyle()}>Bateria</td>
                                <td style={tdStyle({ color: '#ff4d4d', textAlign: 'right', whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' })}>
                                    -{formatCurrency(calculatedPricing.batteryPolicyDiscount)}
                                </td>
                            </tr>
                        )}
                        {calculatedPricing.policyDiscount > 0 && (
                            <tr>
                                <td style={tdStyle()}>Prazo de pagamento</td>
                                <td style={tdStyle({ color: '#ff4d4d', textAlign: 'right', whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' })}>
                                    -{formatCurrency(calculatedPricing.policyDiscount)}
                                </td>
                            </tr>
                        )}
                        {calculatedPricing.totalDiscount !== 0 && (
                            <tr>
                                <td style={tdStyle({ fontWeight: 700, borderBottom: 'none' })}>
                                    Total desconto ({calculatedPricing.discountPercentage.toFixed(1)}%)
                                </td>
                                <td style={tdStyle({ color: calculatedPricing.totalDiscount > 0 ? '#ff4d4d' : '#18a957', textAlign: 'right', whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums', fontWeight: 700, borderBottom: 'none' })}>
                                    {calculatedPricing.totalDiscount > 0 ? '-' : '+'}{formatCurrency(Math.abs(calculatedPricing.totalDiscount))}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            )}

            {!calculatedPricing.originalPrice && (
                <p style={{ color: t.muted, fontSize: '13px', marginTop: '8px' }}>
                    Selecione um dispositivo e variante para ver o resultado.
                </p>
            )}

            {calculatedPricing.originalPrice > 0 && (
                <button
                    type="button"
                    onClick={() => setIsExportModalOpen(true)}
                    style={{ marginTop: '16px', width: '100%', padding: '12px', borderRadius: '14px', background: t.btnBg, color: t.btnText, fontWeight: 900, fontSize: '14px', border: 'none', cursor: 'pointer' }}
                >
                    Exportar orçamento (PDF)
                </button>
            )}
        </div>
    );

    const renderStep = () => {
        switch (currentStep) {
            case 0:
                return (
                    <div className="max-w-[1020px] mx-auto">
                    {/* Toggle dark/light */}
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
                        <button
                            type="button"
                            onClick={() => setIsDark(d => !d)}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '8px',
                                padding: '7px 14px', borderRadius: '999px', cursor: 'pointer',
                                background: t.chipBg, border: t.chipBorder,
                                color: t.muted, fontSize: '13px', fontWeight: 700,
                            }}
                        >
                            {isDark ? '☀️ Modo Claro' : '🌙 Modo Escuro'}
                        </button>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1.25fr 0.75fr', gap: '20px', alignItems: 'start' }}>
                        {/* Left card */}
                        <div style={cardStyle}>
                            {/* Step 1: Modelo */}
                            <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                        <div style={{ width: '26px', height: '26px', borderRadius: '10px', background: t.stepCircleBg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 950, fontSize: '13px', color: t.text, flexShrink: 0 }}>1</div>
                                        <span style={{ fontWeight: 950, fontSize: '15px', color: t.text }}>Modelo</span>
                                    </div>
                                    <span style={{ padding: '6px 10px', borderRadius: '999px', fontWeight: 900, fontSize: '12px', color: t.muted, border: `1px solid ${t.badgeBorder}` }}>Obrigatório</span>
                                </div>
                                <label style={labelStyle}>Dispositivo</label>
                                {(() => {
                                    const devicesList = Array.isArray(devicesData) ? devicesData : (devicesData as any)?.data ?? [];
                                    return (
                                        <select
                                            style={selectStyle}
                                            value={selectedDevice ? String(selectedDevice.id) : ''}
                                            onChange={(e) => handleDeviceSelect(e.target.value)}
                                            disabled={devicesLoading || !!devicesError}
                                        >
                                            <option value="">{devicesLoading ? 'Carregando...' : 'Selecione um dispositivo'}</option>
                                            {devicesList.map((d: any) => (
                                                <option key={d.id} value={String(d.id)}>{d.brand} • {d.name}</option>
                                            ))}
                                        </select>
                                    );
                                })()}
                                {devicesError && <p style={{ color: '#ff4d4d', fontSize: '13px', marginTop: '8px' }}>Erro ao carregar dispositivos</p>}
                            </div>

                            {/* Step 2: Variante */}
                            {selectedDevice && selectedDevice.variants && selectedDevice.variants.length > 0 && (
                                <div style={{ borderTop: `1px solid ${t.divider}`, paddingTop: '16px', marginTop: '16px' }}>
                                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '4px' }}>
                                        <div style={{ width: '26px', height: '26px', borderRadius: '10px', background: t.stepCircleBg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 950, fontSize: '13px', color: t.text, flexShrink: 0 }}>2</div>
                                        <span style={{ fontWeight: 950, fontSize: '15px', color: t.text }}>Variante</span>
                                    </div>
                                    <label style={labelStyle}>Modelo e Memória</label>
                                    <select
                                        style={selectStyle}
                                        value={selectedVariant?._id || selectedVariant?.id || ''}
                                        onChange={(e) => handleVariantSelect(e.target.value)}
                                    >
                                        <option value="">Selecione modelo e memória</option>
                                        {selectedDevice.variants
                                            .filter((v: any) => v.isActive !== false)
                                            .map((variant: any) => (
                                                <option key={variant._id || variant.id} value={String(variant._id || variant.id)}>
                                                    {variant.model} • {variant.memory} — {formatCurrency(parseFloat(variant.price.toString()))}{variant.sku ? ` (${variant.sku})` : ''}
                                                </option>
                                            ))}
                                    </select>
                                </div>
                            )}

                            {/* Step 3: Conservação */}
                            {selectedDevice && selectedVariant && (selectedDevice as any).applicableConservationStates?.length > 0 && (
                                <div style={{ borderTop: `1px solid ${t.divider}`, paddingTop: '16px', marginTop: '16px' }}>
                                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '4px' }}>
                                        <div style={{ width: '26px', height: '26px', borderRadius: '10px', background: t.stepCircleBg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 950, fontSize: '13px', color: t.text, flexShrink: 0 }}>3</div>
                                        <span style={{ fontWeight: 950, fontSize: '15px', color: t.text }}>Estado de Conservação</span>
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '8px', marginTop: '10px' }}>
                                        {(selectedDevice as any).applicableConservationStates.map((acs: any) => {
                                            const csId = acs.id || acs._id;
                                            const name = acs.conservationState?.name || acs.name || csId;
                                            const isSelected = selectedConservationStateId === String(csId);
                                            const op = acs.operation || acs.conservationState?.operation || 'subtract';
                                            return (
                                                <div
                                                    key={csId}
                                                    onClick={() => setSelectedConservationStateId(isSelected ? '' : String(csId))}
                                                    style={{
                                                        display: 'flex', gap: '10px', padding: '10px',
                                                        borderRadius: '14px', cursor: 'pointer',
                                                        background: isSelected ? t.chipSelectedBg : t.chipBg,
                                                        border: isSelected ? t.chipSelectedBorder : t.chipBorder,
                                                        transition: 'all 0.15s',
                                                    }}
                                                >
                                                    {/* indicador visual customizado */}
                                                    <div style={{
                                                        marginTop: '2px', flexShrink: 0,
                                                        width: '16px', height: '16px', borderRadius: '50%',
                                                        border: isSelected ? `5px solid ${t.text}` : `2px solid ${t.muted}`,
                                                        transition: 'all 0.15s',
                                                    }} />
                                                    <div>
                                                        <p style={{ fontWeight: 950, fontSize: '13px', color: t.text }}>{name}</p>
                                                        {acs.value > 0 && (
                                                            <p style={{ fontSize: '12px', color: t.muted, marginTop: '2px' }}>
                                                                {op === 'add' ? '+' : '-'}{formatCurrency(acs.value)}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* Step 4: Bateria */}
                            {selectedDevice && selectedVariant && <div style={{ borderTop: `1px solid ${t.divider}`, paddingTop: '16px', marginTop: '16px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                        <div style={{ width: '26px', height: '26px', borderRadius: '10px', background: t.stepCircleBg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 950, fontSize: '13px', color: t.text, flexShrink: 0 }}>4</div>
                                        <span style={{ fontWeight: 950, fontSize: '15px', color: t.text }}>Saúde da Bateria</span>
                                    </div>
                                    <span style={{ padding: '6px 10px', borderRadius: '999px', fontWeight: 900, fontSize: '12px', color: t.muted, border: `1px solid ${t.badgeBorder}` }}>{batteryPercentage}%</span>
                                </div>
                                <input
                                    type="range" min="0" max="100" step="1" value={batteryPercentage}
                                    onChange={(e) => { const v = Number(e.target.value); setBatteryPercentage(v); form.setValue('batteryPercentage', v); }}
                                    style={{ width: '100%', marginTop: '10px', accentColor: '#ffffff' }}
                                />
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: t.muted, marginTop: '4px' }}>
                                    <span>0%</span><span>50%</span><span>100%</span>
                                </div>
                                {getBatteryPolicy && batteryPercentage > 0 && (
                                    <p style={{ color: t.muted, fontSize: '12px', marginTop: '8px', lineHeight: 1.35 }}>
                                        Política aplicada: {getBatteryPolicy.damageType?.name} (−{formatCurrency(batteryPolicyDiscount)})
                                    </p>
                                )}
                            </div>}

                            {/* Step 5: Modalidade + Prazo */}
                            {selectedDevice && selectedVariant && <div style={{ borderTop: `1px solid ${t.divider}`, paddingTop: '16px', marginTop: '16px' }}>
                                <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '4px' }}>
                                    <div style={{ width: '26px', height: '26px', borderRadius: '10px', background: t.stepCircleBg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 950, fontSize: '13px', color: t.text, flexShrink: 0 }}>5</div>
                                    <span style={{ fontWeight: 950, fontSize: '15px', color: t.text }}>Modalidade</span>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: preferredSaleMode === 'sale' ? '1fr 1fr' : '1fr', gap: '12px' }}>
                                    <div>
                                        <label style={labelStyle}>Modalidade Preferida</label>
                                        <select {...form.register('preferredSaleMode')} style={selectStyle}>
                                            {SALE_MODES.map((mode) => (
                                                <option key={mode.value} value={mode.value}>{mode.label} — {mode.description}</option>
                                            ))}
                                        </select>
                                    </div>
                                    {preferredSaleMode === 'sale' && (
                                        <div>
                                            <label style={labelStyle}>Prazo de Pagamento</label>
                                            <select
                                                style={selectStyle}
                                                value={selectedPaymentTiming}
                                                onChange={(e) => { setSelectedPaymentTiming(e.target.value); form.setValue('paymentTiming', e.target.value); }}
                                            >
                                                <option value="">Selecione o prazo</option>
                                                {paymentTimingOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                                            </select>
                                        </div>
                                    )}
                                </div>
                            </div>}

                            {/* Step 6: Defeitos */}
                            {selectedDevice && selectedVariant && selectedDevice.applicableDamageTypes && selectedDevice.applicableDamageTypes.filter((adt: any) => {
                                const n = adt.damageType?.name?.toLowerCase() || '';
                                return !n.includes('bateria') && !n.includes('battery');
                            }).length > 0 && (
                                <div style={{ borderTop: `1px solid ${t.divider}`, paddingTop: '16px', marginTop: '16px' }}>
                                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '4px' }}>
                                        <div style={{ width: '26px', height: '26px', borderRadius: '10px', background: t.stepCircleBg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 950, fontSize: '13px', color: t.text, flexShrink: 0 }}>6</div>
                                        <span style={{ fontWeight: 950, fontSize: '15px', color: t.text }}>Defeitos</span>
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '10px' }}>
                                        {selectedDevice.applicableDamageTypes
                                            .filter((adt: any) => { const n = adt.damageType?.name?.toLowerCase() || ''; return !n.includes('bateria') && !n.includes('battery'); })
                                            .map((adt: any) => {
                                                const adtId = adt.id || adt._id;
                                                const isSelected = selectedDamageIds.includes(adtId);
                                                const blocks = adt.blocksSubmission ?? adt.damageType?.blocksSubmission ?? false;
                                                const op = adt.operation || adt.damageType?.operation || 'subtract';
                                                return (
                                                    <div
                                                        key={adtId}
                                                        onClick={() => {
                                                            const newSelected = isSelected
                                                                ? selectedDamageIds.filter((id: string) => id !== adtId)
                                                                : [...selectedDamageIds, adtId];
                                                            form.setValue('applicableDamageTypes', newSelected);
                                                        }}
                                                        style={{
                                                            display: 'flex', gap: '10px', padding: '10px',
                                                            borderRadius: '14px', cursor: 'pointer',
                                                            background: isSelected && blocks ? 'rgba(255,77,77,0.08)' : isSelected ? t.chipSelectedBg : t.chipBg,
                                                            border: isSelected && blocks ? '1px solid rgba(255,77,77,0.35)' : isSelected ? t.chipSelectedBorder : t.chipBorder,
                                                            transition: 'all 0.15s',
                                                        }}
                                                    >
                                                        <div style={{
                                                            marginTop: '2px', flexShrink: 0,
                                                            width: '16px', height: '16px', borderRadius: '4px',
                                                            border: isSelected && blocks ? '2px solid #ff4d4d' : isSelected ? `2px solid ${t.text}` : `2px solid ${t.muted}`,
                                                            background: isSelected && blocks ? 'rgba(255,77,77,0.20)' : isSelected ? t.text : 'transparent',
                                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                            transition: 'all 0.15s',
                                                        }}>
                                                            {isSelected && <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 5l2.5 2.5L8 3" stroke={blocks ? '#ff4d4d' : (isDark ? '#000' : '#fff')} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                                                        </div>
                                                        <div>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                                <p style={{ fontWeight: 950, fontSize: '13px', color: blocks && isSelected ? '#ff4d4d' : t.text }}>{adt.damageType?.name}</p>
                                                                {blocks && <span style={{ padding: '2px 8px', borderRadius: '999px', fontWeight: 900, fontSize: '11px', color: '#ff4d4d', border: '1px solid rgba(255,77,77,0.35)', background: 'rgba(255,77,77,0.08)' }}>Inapto</span>}
                                                            </div>
                                                            {adt.damageType?.description && <p style={{ fontSize: '12px', color: t.muted, marginTop: '2px', lineHeight: 1.35 }}>{adt.damageType.description}</p>}
                                                            {adt.defaultDiscountPercentage > 0 && (
                                                                <p style={{ fontSize: '12px', color: t.muted, marginTop: '2px' }}>
                                                                    {op === 'add' ? '+' : '−'}{formatCurrency(adt.defaultDiscountPercentage)}
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                    </div>

                                    {blockingDamage && (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 14px', borderRadius: '14px', background: 'rgba(255,77,77,0.08)', border: '1px solid rgba(255,77,77,0.35)', marginTop: '12px' }}>
                                            <span style={{ fontSize: '16px' }}>❌</span>
                                            <p style={{ color: '#ff4d4d', fontWeight: 700, fontSize: '13px' }}>Dispositivo não apto para compra ou troca</p>
                                        </div>
                                    )}
                                </div>
                            )}

                        </div>

                        {/* Right: Price Calculator */}
                        <PriceCalculator />
                    </div>
                    </div>
                );

            case 1: // Contact Info (só para anônimos)
                if (!isAnonymous) return null;

                return (
                    <Card className="bg-white border border-gray-200 shadow-sm">
                        <CardHeader className="text-center">
                            <CardTitle className="text-2xl font-bold text-gray-900">
                                Informações de Contato
                            </CardTitle>
                            <p className="text-gray-500 mt-2">Para que possamos entrar em contato sobre sua submissão</p>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <Input
                                {...form.register('contactName')}
                                label="Nome Completo *"
                                placeholder="Digite seu nome completo"
                                error={form.formState.errors.contactName?.message}
                                className="rounded-xl border-2 focus:border-gray-500 focus:ring-2 focus:ring-gray-200"
                            />

                            <Input
                                {...form.register('contactEmail')}
                                type="email"
                                label="E-mail *"
                                placeholder="seu@email.com"
                                error={form.formState.errors.contactEmail?.message}
                                className="rounded-xl border-2 focus:border-gray-500 focus:ring-2 focus:ring-gray-200"
                            />

                            <Input
                                {...form.register('contactPhone')}
                                label="Telefone *"
                                placeholder="(11) 99999-9999"
                                error={form.formState.errors.contactPhone?.message}
                                className="rounded-xl border-2 focus:border-gray-500 focus:ring-2 focus:ring-gray-200"
                                helperText="Inclua DDD"
                            />
                        </CardContent>
                    </Card>
                );

            case 2: // Confirmation (usuários autenticados) ou case 2 para anônimos
                return (
                    <Card className="bg-white border border-gray-200 shadow-sm">
                        <CardHeader className="text-center">
                            <CardTitle className="text-2xl font-bold text-gray-900">
                                Confirmação
                            </CardTitle>
                            <p className="text-gray-500 mt-2">Revise as informações antes de enviar</p>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {/* Device Summary */}
                            <div className="bg-white p-6 rounded-xl shadow-sm">
                                <h3 className="font-bold text-gray-900 mb-4 text-lg">Dispositivo</h3>
                                <div className="space-y-2">
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Marca e Modelo:</span>
                                        <span className="font-medium text-gray-900">
                                            {selectedDevice?.brand} {selectedDevice?.name}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Variante:</span>
                                        <span className="font-medium text-gray-900">
                                            {selectedVariant?.model} • {selectedVariant?.memory}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Bateria:</span>
                                        <span className="font-medium text-gray-900">
                                            {batteryPercentage}%
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Modalidade:</span>
                                        <span className="font-medium text-gray-900">
                                            {SALE_MODES.find(m => m.value === preferredSaleMode)?.label}
                                        </span>
                                    </div>
                                    {preferredSaleMode === 'sale' && selectedPaymentTiming && (
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Prazo:</span>
                                            <span className="font-medium text-gray-900">
                                                {paymentTimingOptions.find(o => o.value === selectedPaymentTiming)?.label}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Pricing Summary */}
                            <div className="bg-gray-50 border border-gray-200 p-6 rounded-xl">
                                <h3 className="font-bold text-gray-900 mb-4 text-lg">Resumo de Preços</h3>
                                <div className="space-y-3">
                                    <div className="flex justify-between text-lg">
                                        <span className="text-gray-600">Preço Original:</span>
                                        <span className="font-bold text-gray-900">
                                            {formatCurrency(calculatedPricing.originalPrice)}
                                        </span>
                                    </div>
                                    {calculatedPricing.totalDiscount > 0 && (
                                        <>
                                            <div className="border-t border-gray-300 pt-2"></div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">Desconto Total:</span>
                                                <span className="font-bold text-gray-800">
                                                    -{formatCurrency(calculatedPricing.totalDiscount)}
                                                </span>
                                            </div>
                                        </>
                                    )}
                                    <div className="border-t-2 border-gray-900 pt-3"></div>
                                    <div className="flex justify-between text-2xl">
                                        <span className="text-gray-900 font-bold">Valor Final:</span>
                                        <span className="font-bold text-gray-900">
                                            {formatCurrency(calculatedPricing.finalPrice)}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Contact Info (apenas para anônimos) */}
                            {isAnonymous && (
                                <div className="bg-white p-6 rounded-xl shadow-sm">
                                    <h3 className="font-bold text-gray-900 mb-4 text-lg">Contato</h3>
                                    <div className="space-y-2">
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Nome:</span>
                                            <span className="font-medium text-gray-900">
                                                {form.watch('contactName')}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">E-mail:</span>
                                            <span className="font-medium text-gray-900">
                                                {form.watch('contactEmail')}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Telefone:</span>
                                            <span className="font-medium text-gray-900">
                                                {formatPhone(form.watch('contactPhone'))}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Aviso global de bloqueio */}
                            {blockingDamage && (
                                <div className="flex items-center gap-3 p-4 bg-red-50 border-2 border-red-400 rounded-xl">
                                    <svg className="w-6 h-6 text-red-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                    </svg>
                                    <p className="text-red-700 font-semibold text-sm">
                                        Dispositivo não apto para compra ou troca
                                    </p>
                                </div>
                            )}

                            {/* Submit Button */}
                            <Button
                                type="submit"
                                className="w-full py-4 text-lg font-bold bg-gray-900 hover:bg-gray-700
                                         text-white rounded-xl shadow-sm transition-all duration-200"
                                disabled={isSubmitting || !!blockingDamage}
                                onClick={form.handleSubmit(onSubmit)}
                            >
                                {isSubmitting ? (
                                    <span className="flex items-center justify-center">
                                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Enviando...
                                    </span>
                                ) : blockingDamage ? (
                                    '🚫 Submissão Bloqueada'
                                ) : (
                                    '🚀 Enviar Submissão'
                                )}
                            </Button>
                        </CardContent>
                    </Card>
                );

            default:
                return null;
        }
    };

    return (
        <>
        <form className="min-h-screen p-4 md:p-6" style={{ background: t.pageBg, fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", system-ui, sans-serif', WebkitFontSmoothing: 'antialiased' }}>
            {/* <StepIndicator /> */}
            {renderStep()}

            {/* Botões de Ação removidos - sem navegação entre steps */}
            {onCancel && (
                <div className="mt-6 flex justify-center">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={onCancel}
                        className="px-6 py-2 border-2 border-gray-300 rounded-xl hover:bg-gray-50"
                    >
                        Cancelar
                    </Button>
                </div>
            )}
        </form>

        {/* Modal de Exportação */}
        {isExportModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                    <div className="flex items-center justify-between p-6 border-b">
                        <h2 className="text-lg font-bold text-gray-900">Exportar Orçamento</h2>
                        <button
                            type="button"
                            onClick={() => setIsExportModalOpen(false)}
                            className="text-gray-400 hover:text-gray-600 transition-colors"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    <div className="p-6 space-y-4">
                        <p className="text-sm text-gray-500">Preencha os dados do vendedor que serão exibidos no orçamento.</p>

                        <div className="space-y-3">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Vendedor</label>
                                <input
                                    type="text"
                                    placeholder="Nome completo"
                                    value={exportSeller.name}
                                    onChange={(e) => setExportSeller(s => ({ ...s, name: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400 text-sm text-gray-900"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
                                <input
                                    type="tel"
                                    placeholder="(00) 9 0000-0000"
                                    value={exportSeller.phone}
                                    onChange={(e) => {
                                        const digits = e.target.value.replace(/\D/g, '').slice(0, 11);
                                        let formatted = digits;
                                        if (digits.length > 2) formatted = `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
                                        if (digits.length > 7) formatted = `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
                                        setExportSeller(s => ({ ...s, phone: formatted }));
                                    }}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400 text-sm text-gray-900"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">E-mail</label>
                                <input
                                    type="email"
                                    placeholder="email@empresa.com"
                                    value={exportSeller.email}
                                    onChange={(e) => setExportSeller(s => ({ ...s, email: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400 text-sm text-gray-900"
                                />
                            </div>
                        </div>

                        {/* Preview do PDF */}
                        <div ref={exportRef} className="bg-white border border-gray-200 rounded-xl p-6 space-y-4 mt-4">
                            {/* Cabeçalho com logo */}
                            <div className="flex items-center justify-between border-b pb-4">
                                <img src={logoSrc} alt="Logo" className="h-12 w-auto" />
                                <div className="text-right">
                                    <p className="text-xs text-gray-500">Data</p>
                                    <p className="text-sm font-medium text-gray-700">
                                        {new Date().toLocaleDateString('pt-BR')}
                                    </p>
                                </div>
                            </div>

                            {/* Título */}
                            <div className="text-center">
                                <h3 className="text-lg font-bold text-gray-900">Orçamento de Dispositivo</h3>
                                {selectedDevice && (
                                    <p className="text-sm text-gray-600 mt-1">{selectedDevice.name}</p>
                                )}
                                {selectedVariant && (
                                    <p className="text-sm text-purple-600 font-medium">{selectedVariant.model} • {selectedVariant.memory}</p>
                                )}
                            </div>

                            {/* Precificação */}
                            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">Preço Original:</span>
                                    <span className="font-semibold text-gray-900">{formatCurrency(calculatedPricing.originalPrice)}</span>
                                </div>

                                {calculatedPricing.damageItems?.map((item, idx) => (
                                    <div key={idx} className="flex justify-between text-sm">
                                        <span className={item.isAdd ? 'text-green-600' : 'text-red-600'}>
                                            {item.isAdd ? 'Acréscimo' : 'Desconto'} — {item.name}:
                                        </span>
                                        <span className={`font-medium ${item.isAdd ? 'text-green-600' : 'text-red-600'}`}>
                                            {item.isAdd ? '+' : '-'}{formatCurrency(item.amount)}
                                        </span>
                                    </div>
                                ))}

                                {calculatedPricing.conservationDiscount !== 0 && (
                                    <div className="flex justify-between text-sm">
                                        <span className={calculatedPricing.conservationDiscount > 0 ? 'text-red-600' : 'text-green-600'}>
                                            {calculatedPricing.conservationDiscount > 0 ? 'Desconto' : 'Acréscimo'} por Conservação:
                                        </span>
                                        <span className={`font-medium ${calculatedPricing.conservationDiscount > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                            {calculatedPricing.conservationDiscount > 0 ? '-' : '+'}{formatCurrency(Math.abs(calculatedPricing.conservationDiscount))}
                                        </span>
                                    </div>
                                )}

                                {calculatedPricing.policyDiscount > 0 && (
                                    <div className="flex justify-between text-sm">
                                        <span className="text-orange-600">Desconto por Prazo:</span>
                                        <span className="font-medium text-orange-600">-{formatCurrency(calculatedPricing.policyDiscount)}</span>
                                    </div>
                                )}

                                {calculatedPricing.batteryPolicyDiscount > 0 && (
                                    <div className="flex justify-between text-sm">
                                        <span className="text-blue-600">Desconto por Bateria:</span>
                                        <span className="font-medium text-blue-600">-{formatCurrency(calculatedPricing.batteryPolicyDiscount)}</span>
                                    </div>
                                )}

                                <div className="border-t border-gray-300 pt-2 flex justify-between items-center">
                                    <span className="text-base font-bold text-green-700">Valor Final:</span>
                                    <span className="text-xl font-bold text-green-700">{formatCurrency(calculatedPricing.finalPrice)}</span>
                                </div>
                            </div>

                            {/* Dados do vendedor */}
                            {(exportSeller.name || exportSeller.phone || exportSeller.email) && (
                                <div className="border-t pt-4">
                                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Vendedor Responsável</p>
                                    <div className="space-y-1">
                                        {exportSeller.name && (
                                            <p className="text-sm text-gray-800 font-medium">{exportSeller.name}</p>
                                        )}
                                        {exportSeller.phone && (
                                            <p className="text-sm text-gray-600">📞 {exportSeller.phone}</p>
                                        )}
                                        {exportSeller.email && (
                                            <p className="text-sm text-gray-600">✉️ {exportSeller.email}</p>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="flex gap-3 pt-2">
                            <button
                                type="button"
                                onClick={() => setIsExportModalOpen(false)}
                                className="flex-1 px-4 py-2 border border-gray-300 rounded-xl text-gray-700 font-medium hover:bg-gray-50 transition-colors text-sm"
                            >
                                Cancelar
                            </button>
                            <button
                                type="button"
                                onClick={handleExport}
                                disabled={isExporting}
                                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 transition-colors text-sm disabled:opacity-60 flex items-center justify-center gap-2"
                            >
                                {isExporting ? (
                                    <>
                                        <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                                        </svg>
                                        Gerando...
                                    </>
                                ) : (
                                    <>
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                        </svg>
                                        Baixar PDF
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        )}
        </>
    );
}
