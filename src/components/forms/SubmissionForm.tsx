import { useState, useEffect, useMemo } from 'react';
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

    // Função para formatar valores em moeda brasileira
    const formatCurrency = (value: number): string => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(value);
    };

    // Mapeamento de payment timing para labels
    const paymentTimingOptions = [
        { value: 'ten_days', label: '10 dias' },
        { value: 'fifteen_days', label: '15 dias' },
        { value: 'thirty_days', label: '30 dias' }
    ];

    // Definir etapas do processo baseado no tipo de usuário
    const getSteps = () => {
        const baseSteps = [
            { id: 1, name: 'Detalhes', description: 'Informações do dispositivo' }
        ];

        if (isAnonymous) {
            baseSteps.push({ id: 2, name: 'Contato', description: 'Dados para contato' });
        }

        baseSteps.push({ id: baseSteps.length + 1, name: 'Confirmação', description: 'Revisão final' });
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

    // Reset payment timing quando modalidade mudar
    useEffect(() => {
        if (preferredSaleMode !== 'sale') {
            setSelectedPaymentTiming('');
            form.setValue('paymentTiming', '');
        }
    }, [preferredSaleMode, form]);

    // Função para determinar política de bateria baseada na porcentagem
    const getBatteryPolicy = useMemo(() => {
        if (!selectedDevice || !selectedDevice.applicableDamageTypes || selectedDevice.applicableDamageTypes.length === 0) {
            return null;
        }

        const batteryDamageTypes = selectedDevice.applicableDamageTypes.filter((adt: any) => {
            const name = adt.damageType?.name?.toLowerCase() || '';
            const hasBattery = name.includes('bateria') || name.includes('battery');
            return hasBattery;
        });

        if (batteryDamageTypes.length === 0) {
            return null;
        }

        if (batteryPercentage >= 80 && batteryPercentage <= 100) {
            const selectedDamageType = batteryDamageTypes.find((adt: any) => {
                const name = adt.damageType?.name?.toLowerCase() || '';
                return name.includes('alta') || name.includes('high') || name.includes('80') || name.includes('100');
            }) || batteryDamageTypes[0];
            return selectedDamageType;
        } else if (batteryPercentage >= 10 && batteryPercentage < 80) {
            const selectedDamageType = batteryDamageTypes.find((adt: any) => {
                const name = adt.damageType?.name?.toLowerCase() || '';
                return name.includes('baixa') || name.includes('low') || name.includes('media') || name.includes('medium') || name.includes('10') || name.includes('80');
            }) || batteryDamageTypes[0];
            return selectedDamageType;
        } else if (batteryPercentage > 0) {
            return batteryDamageTypes[0];
        }

        return null;
    }, [selectedDevice, batteryPercentage]);

    // Calcular desconto da política de preço baseado no payment timing selecionado
    const policyDiscount = useMemo(() => {
        if (!selectedPaymentTiming || preferredSaleMode !== 'sale') {
            return 0;
        }

        if (!selectedDevice || !selectedDevice.specificPricingPolicies) {
            return 0;
        }

        // Buscar desconto nas políticas específicas do dispositivo
        const selectedPolicy = selectedDevice.specificPricingPolicies.find((policy: any) => {
            return policy.paymentTiming === selectedPaymentTiming &&
                   policy.saleMode === 'sale';
        });

        return selectedPolicy ? selectedPolicy.discountAmount : 0;
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
                policyDiscount: 0,
                batteryPolicyDiscount: 0,
                totalDiscount: 0,
                finalPrice: 0,
                discountPercentage: 0
            };
        }

        const originalPrice = parseFloat(selectedVariant.price.toString());
        let damageDiscountAmount = 0;

        // Só aplicar descontos de dano se for venda
        if (preferredSaleMode === 'sale' && selectedDevice.applicableDamageTypes) {
            selectedDevice.applicableDamageTypes.forEach((adt: any) => {
                const adtId = adt.id || adt._id;
                if (selectedDamageIds.includes(adtId) && typeof adt.defaultDiscountPercentage === 'number') {
                    // defaultDiscountPercentage é valor fixo em R$, não porcentagem
                    damageDiscountAmount += adt.defaultDiscountPercentage;
                }
            });
        }

        // Só considerar descontos de política e bateria se for venda
        const effectivePolicyDiscount = preferredSaleMode === 'sale' ? policyDiscount : 0;
        const effectiveBatteryDiscount = preferredSaleMode === 'sale' ? batteryPolicyDiscount : 0;

        const totalDiscountAmount = damageDiscountAmount + effectivePolicyDiscount + effectiveBatteryDiscount;
        const finalPrice = Math.max(0, originalPrice - totalDiscountAmount);
        const discountPercentage = originalPrice > 0 ? (totalDiscountAmount / originalPrice) * 100 : 0;

        return {
            originalPrice,
            damageDiscount: damageDiscountAmount,
            policyDiscount: effectivePolicyDiscount,
            batteryPolicyDiscount: effectiveBatteryDiscount,
            totalDiscount: totalDiscountAmount,
            finalPrice,
            discountPercentage: Math.min(100, discountPercentage)
        };
    }, [selectedDevice, selectedVariant, selectedDamageIds, policyDiscount, batteryPolicyDiscount, preferredSaleMode]);

    useEffect(() => {
        form.setValue('deviceId', selectedDevice ? String(selectedDevice.id) : '');
        form.setValue('variantId', selectedVariant?._id || selectedVariant?.id || '');
        form.setValue('applicableDamageTypes', []);

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

    const StepIndicator = () => (
        <div className="w-full bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8">
            <div className="flex items-center justify-between relative">
                <div className="absolute top-6 left-0 right-0 h-0.5 bg-gray-200 z-0"></div>
                <div
                    className="absolute top-6 left-0 h-0.5 bg-gradient-to-r from-blue-500 to-purple-600 z-10 transition-all duration-500 ease-in-out"
                    style={{ width: `${(currentStep / (steps.length - 1)) * 100}%` }}
                ></div>

                {steps.map((step, index) => (
                    <div key={step.id} className="flex flex-col items-center relative z-20">
                        <div className={`
              w-12 h-12 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300
              ${index <= currentStep
                                ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
                                : 'bg-white border-2 border-gray-300 text-gray-400'
                            }
            `}>
                            {index < currentStep ? (
                                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                            ) : (
                                index + 1
                            )}
                        </div>
                        <div className="mt-3 text-center">
                            <div className={`text-sm font-medium ${index <= currentStep ? 'text-gray-900' : 'text-gray-400'}`}>
                                {step.name}
                            </div>
                            <div className={`text-xs mt-1 ${index <= currentStep ? 'text-gray-600' : 'text-gray-400'}`}>
                                {step.description}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );

    // Componente de Calculadora de Preço
    const PriceCalculator = () => (
        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 shadow-lg sticky top-4">
            <CardHeader className="text-center">
                <CardTitle className="text-xl font-bold text-green-800 flex items-center justify-center">
                    💰 Calculadora de Preço
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {selectedVariant && (
                    <div className="bg-white p-3 rounded-lg shadow-sm mb-4">
                        <div className="text-center">
                            <p className="text-sm text-gray-600">Variante Selecionada</p>
                            <p className="text-lg font-bold text-purple-600">
                                {selectedVariant.model} • {selectedVariant.memory}
                            </p>
                            {selectedVariant.sku && (
                                <p className="text-xs text-gray-500 mt-1">SKU: {selectedVariant.sku}</p>
                            )}
                        </div>
                    </div>
                )}

                <div className="bg-white p-4 rounded-xl shadow-sm">
                    <div className="space-y-3">
                        <div className="flex justify-between items-center">
                            <span className="text-gray-600 font-medium">Preço Original:</span>
                            <span className="text-xl font-bold text-gray-900">
                                {formatCurrency(calculatedPricing.originalPrice)}
                            </span>
                        </div>

                        {(calculatedPricing.damageDiscount > 0 || calculatedPricing.policyDiscount > 0 || calculatedPricing.batteryPolicyDiscount > 0) && (
                            <div className="border-t border-gray-200 pt-3 space-y-2">
                                {calculatedPricing.damageDiscount > 0 && (
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-red-600">Desconto por Condição:</span>
                                        <span className="font-medium text-red-600">
                                            -{formatCurrency(calculatedPricing.damageDiscount)}
                                        </span>
                                    </div>
                                )}

                                {calculatedPricing.policyDiscount > 0 && (
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-orange-600">Desconto por Prazo:</span>
                                        <span className="font-medium text-orange-600">
                                            -{formatCurrency(calculatedPricing.policyDiscount)}
                                        </span>
                                    </div>
                                )}

                                {calculatedPricing.batteryPolicyDiscount > 0 && (
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-blue-600">Desconto por Bateria:</span>
                                        <span className="font-medium text-blue-600">
                                            -{formatCurrency(calculatedPricing.batteryPolicyDiscount)}
                                        </span>
                                    </div>
                                )}

                                <div className="flex justify-between items-center border-t pt-2">
                                    <span className="text-red-600 font-medium">Desconto Total:</span>
                                    <span className="text-lg font-bold text-red-600">
                                        -{formatCurrency(calculatedPricing.totalDiscount)}
                                    </span>
                                </div>

                                <div className="flex justify-between items-center mt-1">
                                    <span className="text-xs text-gray-500">Percentual:</span>
                                    <span className="text-sm font-medium text-red-500">
                                        -{calculatedPricing.discountPercentage.toFixed(1)}%
                                    </span>
                                </div>
                            </div>
                        )}

                        <div className="border-t-2 border-green-300 pt-3">
                            <div className="flex justify-between items-center">
                                <span className="text-green-700 font-bold text-lg">Valor Final:</span>
                                <span className="text-2xl font-bold text-green-700">
                                    {formatCurrency(calculatedPricing.finalPrice)}
                                </span>
                            </div>
                        </div>

                        {calculatedPricing.totalDiscount === 0 && calculatedPricing.originalPrice > 0 && (
                            <div className="text-center py-2">
                                <span className="text-green-600 font-medium text-sm">
                                    ✅ Nenhum desconto aplicado
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    );

    const renderStep = () => {
        switch (currentStep) {
            case 0: // Device Details (agora inclui seleção de dispositivo)
                return (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Form Column */}
                        <div className="lg:col-span-2 space-y-6">
                            {/* Seleção de Dispositivo e Variante */}
                            <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-0 shadow-lg">
                                <CardHeader className="text-center pb-4">
                                    <CardTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                                        🎯 Selecione seu Dispositivo
                                    </CardTitle>
                                    <p className="text-gray-600 mt-2">Escolha o dispositivo e a variante específica</p>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {/* Seleção de Dispositivo Base */}
                                    <div className="relative">
                                        <label className="block text-sm font-semibold text-gray-800 mb-3">
                                            Dispositivo Base *
                                        </label>
                                        {(() => {
                                            const devicesList = Array.isArray(devicesData)
                                                ? devicesData
                                                : (devicesData as any)?.data ?? [];
                                            return (
                                                <select
                                                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 bg-white text-gray-900
                                                     focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all duration-200
                                                     hover:border-gray-300 shadow-sm"
                                                    value={selectedDevice ? String(selectedDevice.id) : ''}
                                                    onChange={(e) => handleDeviceSelect(e.target.value)}
                                                    disabled={devicesLoading || !!devicesError}
                                                >
                                                    <option value="">{devicesLoading ? 'Carregando...' : 'Selecione um dispositivo'}</option>
                                                    {devicesList.map((d: any) => (
                                                        <option key={d.id} value={String(d.id)}>
                                                            {d.brand} • {d.name}
                                                        </option>
                                                    ))}
                                                </select>
                                            );
                                        })()}
                                        {devicesError && (
                                            <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                                                <p className="text-sm text-red-600 flex items-center">
                                                    <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                                    </svg>
                                                    Erro ao carregar dispositivos
                                                </p>
                                            </div>
                                        )}
                                    </div>

                                    {/* Seleção de Variante */}
                                    {selectedDevice && selectedDevice.variants && selectedDevice.variants.length > 0 && (
                                        <div className="relative animate-fadeIn">
                                            <label className="block text-sm font-semibold text-gray-800 mb-3">
                                                Modelo e Memória *
                                            </label>
                                            <select
                                                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 bg-white text-gray-900
                                                 focus:border-purple-500 focus:ring-4 focus:ring-purple-100 transition-all duration-200
                                                 hover:border-gray-300 shadow-sm"
                                                value={selectedVariant?._id || selectedVariant?.id || ''}
                                                onChange={(e) => handleVariantSelect(e.target.value)}
                                            >
                                                <option value="">Selecione modelo e memória</option>
                                                {selectedDevice.variants
                                                    .filter((v: any) => v.isActive !== false)
                                                    .map((variant: any) => (
                                                        <option key={variant._id || variant.id} value={String(variant._id || variant.id)}>
                                                            {variant.model} • {variant.memory} - {formatCurrency(parseFloat(variant.price.toString()))}
                                                            {variant.sku && ` (${variant.sku})`}
                                                        </option>
                                                    ))}
                                            </select>
                                            <p className="text-xs text-gray-500 mt-2">
                                                💡 Escolha a configuração específica do seu dispositivo
                                            </p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Detalhes do Dispositivo */}
                            <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-0 shadow-lg">
                                <CardHeader className="text-center">
                                    <CardTitle className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                                        📋 Detalhes do Dispositivo
                                    </CardTitle>
                                    <p className="text-gray-600 mt-2">Forneça informações específicas sobre seu dispositivo</p>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-1 gap-6">
                                        <Input
                                            type="number"
                                            min="0"
                                            max="100"
                                            label="Porcentagem da Bateria *"
                                            placeholder="Ex: 85"
                                            value={batteryPercentage}
                                            error={form.formState.errors.batteryPercentage?.message}
                                            className="rounded-xl border-2 focus:border-purple-500 focus:ring-4 focus:ring-purple-100"
                                            helperText="🔋 Digite a porcentagem atual da bateria (0-100%)"
                                            onChange={(e) => {
                                                const value = e.target.value;
                                                const numValue = value ? Number(value) : 0;
                                                setBatteryPercentage(numValue);
                                                form.setValue('batteryPercentage', numValue);
                                            }}
                                        />
                                    </div>

                                    {/* Mostrar política de bateria aplicada */}
                                    {getBatteryPolicy && batteryPercentage > 0 && (
                                        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <h4 className="text-sm font-semibold text-blue-800">
                                                        🔋 Política de Bateria Aplicada
                                                    </h4>
                                                    <p className="text-xs text-blue-600 mt-1">
                                                        {getBatteryPolicy.damageType?.name}
                                                    </p>
                                                </div>
                                                <div className="text-right">
                                                    <span className="text-sm font-bold text-blue-700">
                                                        -{formatCurrency(batteryPolicyDiscount)}
                                                    </span>
                                                    <p className="text-xs text-blue-500">
                                                        {batteryPercentage}% da bateria
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="block text-sm font-semibold text-gray-800">
                                                Modalidade Preferida *
                                            </label>
                                            <select
                                                {...form.register('preferredSaleMode')}
                                                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 bg-white
                                                 focus:border-purple-500 focus:ring-4 focus:ring-purple-100 transition-all"
                                            >
                                                {SALE_MODES.map((mode) => (
                                                    <option key={mode.value} value={mode.value}>
                                                        {mode.label} - {mode.description}
                                                    </option>
                                                ))}
                                            </select>
                                            {form.formState.errors.preferredSaleMode && (
                                                <p className="text-sm text-red-600 mt-1 flex items-center">
                                                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                                    </svg>
                                                    {form.formState.errors.preferredSaleMode.message}
                                                </p>
                                            )}
                                        </div>

                                        {/* Campo de Prazo */}
                                        {preferredSaleMode === 'sale' && (
                                            <div className="space-y-2">
                                                <label className="block text-sm font-semibold text-gray-800">
                                                    Prazo de Pagamento *
                                                </label>
                                                <select
                                                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 bg-white
                                                     focus:border-purple-500 focus:ring-4 focus:ring-purple-100 transition-all"
                                                    value={selectedPaymentTiming}
                                                    onChange={(e) => {
                                                        setSelectedPaymentTiming(e.target.value);
                                                        form.setValue('paymentTiming', e.target.value);
                                                    }}
                                                >
                                                    <option value="">Selecione o prazo</option>
                                                    {paymentTimingOptions.map((option) => (
                                                        <option key={option.value} value={option.value}>
                                                            {option.label}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                        )}
                                    </div>

                                    {/* Seleção de Danos/Condições */}
                                    {selectedDevice && selectedDevice.applicableDamageTypes && selectedDevice.applicableDamageTypes.length > 0 && (
                                        <div className="space-y-3">
                                            <label className="block text-sm font-semibold text-gray-800">
                                                Condições do Dispositivo
                                            </label>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                {selectedDevice.applicableDamageTypes
                                                    .filter((adt: any) => {
                                                        const name = adt.damageType?.name?.toLowerCase() || '';
                                                        return !name.includes('bateria') && !name.includes('battery');
                                                    })
                                                    .map((adt: any) => {
                                                        const adtId = adt.id || adt._id;
                                                        const isSelected = selectedDamageIds.includes(adtId);
                                                        return (
                                                            <div
                                                                key={adtId}
                                                                className={`
                                                                    p-4 rounded-xl border-2 cursor-pointer transition-all duration-200
                                                                    ${isSelected
                                                                        ? 'border-purple-500 bg-purple-50 shadow-md'
                                                                        : 'border-gray-200 bg-white hover:border-gray-300'
                                                                    }
                                                                `}
                                                                onClick={() => {
                                                                    const newSelected = isSelected
                                                                        ? selectedDamageIds.filter((id: string) => id !== adtId)
                                                                        : [...selectedDamageIds, adtId];
                                                                    form.setValue('applicableDamageTypes', newSelected);
                                                                }}
                                                            >
                                                                <div className="flex items-start justify-between">
                                                                    <div className="flex-1">
                                                                        <p className="font-medium text-gray-900">
                                                                            {adt.damageType?.name}
                                                                        </p>
                                                                        {adt.damageType?.description && (
                                                                            <p className="text-xs text-gray-500 mt-1">
                                                                                {adt.damageType.description}
                                                                            </p>
                                                                        )}
                                                                        {preferredSaleMode === 'sale' && adt.defaultDiscountPercentage > 0 && (
                                                                            <p className="text-sm font-semibold text-red-600 mt-2">
                                                                                -{formatCurrency(adt.defaultDiscountPercentage)}
                                                                            </p>
                                                                        )}
                                                                    </div>
                                                                    <div className={`
                                                                        w-5 h-5 rounded border-2 flex items-center justify-center ml-2 flex-shrink-0
                                                                        ${isSelected ? 'border-purple-500 bg-purple-500' : 'border-gray-300'}
                                                                    `}>
                                                                        {isSelected && (
                                                                            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                                                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                                            </svg>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </div>

                        {/* Price Calculator Column */}
                        <div className="lg:col-span-1">
                            <PriceCalculator />
                        </div>
                    </div>
                );

            case 1: // Contact Info (só para anônimos)
                if (!isAnonymous) return null;

                return (
                    <Card className="bg-gradient-to-br from-cyan-50 to-blue-50 border-0 shadow-lg">
                        <CardHeader className="text-center">
                            <CardTitle className="text-2xl font-bold bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent">
                                📞 Informações de Contato
                            </CardTitle>
                            <p className="text-gray-600 mt-2">Para que possamos entrar em contato sobre sua submissão</p>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <Input
                                {...form.register('contactName')}
                                label="Nome Completo *"
                                placeholder="Digite seu nome completo"
                                error={form.formState.errors.contactName?.message}
                                className="rounded-xl border-2 focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100"
                            />

                            <Input
                                {...form.register('contactEmail')}
                                type="email"
                                label="E-mail *"
                                placeholder="seu@email.com"
                                error={form.formState.errors.contactEmail?.message}
                                className="rounded-xl border-2 focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100"
                            />

                            <Input
                                {...form.register('contactPhone')}
                                label="Telefone *"
                                placeholder="(11) 99999-9999"
                                error={form.formState.errors.contactPhone?.message}
                                className="rounded-xl border-2 focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100"
                                helperText="📱 Inclua DDD"
                            />
                        </CardContent>
                    </Card>
                );

            case 2: // Confirmation (usuários autenticados) ou case 2 para anônimos
                return (
                    <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-0 shadow-lg">
                        <CardHeader className="text-center">
                            <CardTitle className="text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                                ✅ Confirmação
                            </CardTitle>
                            <p className="text-gray-600 mt-2">Revise as informações antes de enviar</p>
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
                            <div className="bg-gradient-to-br from-green-100 to-emerald-100 p-6 rounded-xl shadow-sm">
                                <h3 className="font-bold text-green-800 mb-4 text-lg">Resumo de Preços</h3>
                                <div className="space-y-3">
                                    <div className="flex justify-between text-lg">
                                        <span className="text-gray-700">Preço Original:</span>
                                        <span className="font-bold text-gray-900">
                                            {formatCurrency(calculatedPricing.originalPrice)}
                                        </span>
                                    </div>
                                    {calculatedPricing.totalDiscount > 0 && (
                                        <>
                                            <div className="border-t border-green-300 pt-2"></div>
                                            <div className="flex justify-between">
                                                <span className="text-red-600">Desconto Total:</span>
                                                <span className="font-bold text-red-600">
                                                    -{formatCurrency(calculatedPricing.totalDiscount)}
                                                </span>
                                            </div>
                                        </>
                                    )}
                                    <div className="border-t-2 border-green-400 pt-3"></div>
                                    <div className="flex justify-between text-2xl">
                                        <span className="text-green-700 font-bold">Valor Final:</span>
                                        <span className="font-bold text-green-700">
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

                            {/* Submit Button */}
                            <Button
                                type="submit"
                                className="w-full py-4 text-lg font-bold bg-gradient-to-r from-green-600 to-emerald-600
                                         hover:from-green-700 hover:to-emerald-700 text-white rounded-xl shadow-lg
                                         transition-all duration-200 transform hover:scale-105"
                                disabled={isSubmitting}
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
        <form className="max-w-7xl mx-auto p-6 bg-white text-gray-900">
            <StepIndicator />
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
    );
}
