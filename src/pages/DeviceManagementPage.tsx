import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Package, Plus, Edit2, Trash2, X, Save, DollarSign, AlertTriangle, Search, LogOut, UserPlus } from 'lucide-react';

interface DamageType {
    id: string;
    name: string;
    defaultDiscountPercentage: number;
    operation: 'add' | 'subtract';
}

interface ApplicableDamageType {
    id: string;
    defaultDiscountPercentage: number;
    operation: 'add' | 'subtract';
    blocksSubmission: boolean;
}

interface ConservationState {
    id: string;
    name: string;
    operation: 'add' | 'subtract';
}

interface ApplicableConservationState {
    id: string;
    value: number;
    operation: 'add' | 'subtract';
}

interface Variant {
    model: string;
    memory: string;
    price: number;
    sku: string;
    isActive: boolean;
}

interface PricingPolicy {
    id?: string;
    name?: string;
    saleMode: string;
    paymentTiming: string;
    discountAmount: number;
}

interface Device {
    _id?: string;
    name: string;
    brand: string;
    description: string;
    isActive: boolean;
    variants: Variant[];
    specificPricingPolicies: PricingPolicy[];
    applicableDamageTypes: ApplicableDamageType[];
    applicableConservationStates: ApplicableConservationState[];
}

const API_BASE_URL = 'https://api-device.usestarshield.com/api/v1';

function resolveDamageTypeRefId(dt: any, damageTypeCatalog: DamageType[]): string | undefined {
    if (!dt) return undefined;
    const ref = dt.damageType ?? dt.damageTypeId ?? dt.damage_type;
    if (typeof ref === 'string' || typeof ref === 'number') return String(ref);
    if (ref && typeof ref === 'object') {
        const id = ref._id ?? ref.id ?? ref.$oid;
        if (id != null && String(id) !== '') return String(id);
        const name = typeof ref.name === 'string' ? ref.name : undefined;
        if (name && damageTypeCatalog.length > 0) {
            const found = damageTypeCatalog.find(c => c.name === name);
            if (found) return found.id;
        }
    }
    if (dt.id != null && String(dt.id) !== '') return String(dt.id);
    return undefined;
}

function normalizeSpecificPricingPolicyFromApi(
    p: any,
    pricingCatalog: PricingPolicy[]
): PricingPolicy | null {
    if (!p || typeof p !== 'object') return null;
    const nested = p.pricingPolicy ?? p.policy;
    let saleMode: string = p.saleMode ?? '';
    let paymentTiming: string = p.paymentTiming ?? '';
    let discountRaw = p.discountAmount ?? p.discount;

    if (nested && typeof nested === 'object') {
        saleMode = saleMode || nested.saleMode || '';
        paymentTiming = paymentTiming || nested.paymentTiming || '';
        if (discountRaw == null || discountRaw === '') {
            discountRaw = nested.discountAmount ?? nested.discount;
        }
    }

    const refId =
        typeof nested === 'string'
            ? nested
            : nested && typeof nested === 'object'
              ? nested._id ?? nested.id
              : p.pricingPolicyId ?? p.policyId;

    if (
        (!saleMode || !paymentTiming || discountRaw == null || discountRaw === '') &&
        refId != null
    ) {
        const full = pricingCatalog.find(x => String(x.id) === String(refId));
        if (full) {
            saleMode = saleMode || full.saleMode;
            paymentTiming = paymentTiming || full.paymentTiming;
            if (discountRaw == null || discountRaw === '') {
                discountRaw = full.discountAmount;
            }
        }
    }

    if (!saleMode || !paymentTiming) return null;
    const discountAmount = Number(discountRaw);
    return {
        saleMode,
        paymentTiming,
        discountAmount: Number.isFinite(discountAmount) ? discountAmount : 0,
    };
}

export function DeviceManagementPage() {
    const { isAdmin, logout, user } = useAuth();
    const navigate = useNavigate();
    const [devices, setDevices] = useState<Device[]>([]);
    const [damageTypes, setDamageTypes] = useState<DamageType[]>([]);
    const [pricingPolicies, setPricingPolicies] = useState<PricingPolicy[]>([]);
    const [conservationStates, setConservationStates] = useState<ConservationState[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isPricingModalOpen, setIsPricingModalOpen] = useState(false);
    const [isDamageTypeModalOpen, setIsDamageTypeModalOpen] = useState(false);
    const [isConservationStateModalOpen, setIsConservationStateModalOpen] = useState(false);
    const [isCreateUserModalOpen, setIsCreateUserModalOpen] = useState(false);
    const [createUserForm, setCreateUserForm] = useState({ name: '', email: '', password: '', role: 'user' });
    const [createUserLoading, setCreateUserLoading] = useState(false);
    const [createUserError, setCreateUserError] = useState('');
    const [editingDevice, setEditingDevice] = useState<Device | null>(null);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState('');

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const emptyDevice: Device = {
        name: '',
        brand: '',
        description: '',
        isActive: true,
        variants: [],
        specificPricingPolicies: [],
        applicableDamageTypes: [],
        applicableConservationStates: [],
    };

    const emptyPricingPolicy: PricingPolicy = {
        name: '',
        saleMode: '',
        paymentTiming: '',
        discountAmount: 0,
    };

    const emptyDamageType = {
        name: '',
        defaultDiscountPercentage: 0,
        operation: 'subtract' as 'add' | 'subtract',
    };

    const emptyConservationState = {
        name: '',
        operation: 'subtract' as 'add' | 'subtract',
    };

    const [formData, setFormData] = useState<Device>(emptyDevice);
    const [pricingFormData, setPricingFormData] = useState<PricingPolicy>(emptyPricingPolicy);
    const [damageTypeFormData, setDamageTypeFormData] = useState(emptyDamageType);
    const [conservationStateFormData, setConservationStateFormData] = useState(emptyConservationState);

    // Carregar dados iniciais
    useEffect(() => {
        fetchDamageTypes();
        fetchPricingPolicies();
        fetchConservationStates();
        fetchDevices();
    }, []);

    const fetchDevices = async (searchTerm = '') => {
        try {
            const params = new URLSearchParams({ page: '1', limit: '1000' });
            const response = await fetch(`${API_BASE_URL}/devices/public?${params}`);
            const data = await response.json();
            setDevices(data.data);
        } catch (error) {
            console.error('Erro ao carregar dispositivos:', error);
        }
    };

    const fetchDamageTypes = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/damage-types`);
            const raw = await response.json();
            const list = (raw && raw.data) ? raw.data : raw;
            const normalized: DamageType[] = (list || []).map((dt: any) => ({
                id: dt.id || dt._id || dt.uuid || String(dt.id || dt._id),
                name: dt.name,
                defaultDiscountPercentage: dt.defaultDiscountPercentage ?? dt.discount ?? 0,
                operation: (dt.operation === 'add' ? 'add' : 'subtract') as 'add' | 'subtract',
            }));
            setDamageTypes(normalized);
        } catch (error) {
            console.error('Erro ao carregar tipos de dano:', error);
        }
    };

    const fetchConservationStates = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/conservation-states`);
            const raw = await response.json();
            const list = (raw && raw.data) ? raw.data : raw;
            const normalized: ConservationState[] = (list || []).map((cs: any) => ({
                id: cs.id || cs._id || String(cs.id || cs._id),
                name: cs.name,
                operation: (cs.operation === 'add' ? 'add' : 'subtract') as 'add' | 'subtract',
            }));
            setConservationStates(normalized);
        } catch (error) {
            console.error('Erro ao carregar estados de conservação:', error);
        }
    };

    const fetchPricingPolicies = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/pricing-policies`);
            const raw = await response.json();
            const list = (raw && raw.data) ? raw.data : raw;
            const normalized: PricingPolicy[] = (list || []).map((p: any) => ({
                id: p.id || p._id || p.uuid || String(p.id || p._id),
                name: p.name,
                saleMode: p.saleMode,
                paymentTiming: p.paymentTiming,
                discountAmount: p.discountAmount ?? p.discount ?? 0,
            }));
            setPricingPolicies(normalized);
        } catch (error) {
            console.error('Erro ao carregar políticas de preço:', error);
        }
    };

    const normalizeDeviceForForm = (device: Device): Device => {
        const rawAdt = (device as any).applicableDamageTypes ?? [];
        const applicableDamageTypes: ApplicableDamageType[] = rawAdt
            .map((item: any) => {
                const id = resolveDamageTypeRefId(item, damageTypes);
                if (!id) return null;
                return {
                    id,
                    defaultDiscountPercentage: Number(item.defaultDiscountPercentage ?? item.discount ?? 0) || 0,
                    operation: (item.operation === 'add' ? 'add' : 'subtract') as 'add' | 'subtract',
                    blocksSubmission: !!item.blocksSubmission,
                };
            })
            .filter(Boolean) as ApplicableDamageType[];

        const rawPol = (device as any).specificPricingPolicies ?? [];
        const specificPricingPolicies: PricingPolicy[] = rawPol
            .map((item: any) => normalizeSpecificPricingPolicyFromApi(item, pricingPolicies))
            .filter(Boolean) as PricingPolicy[];

        const rawCs = (device as any).applicableConservationStates ?? [];
        const applicableConservationStates: ApplicableConservationState[] = rawCs
            .map((item: any) => {
                const ref = item.conservationState ?? item.conservationStateId ?? item.conservation_state;
                let id: string | undefined;
                if (typeof ref === 'string' || typeof ref === 'number') id = String(ref);
                else if (ref && typeof ref === 'object') id = String(ref._id ?? ref.id ?? '');
                if (!id && item.id) id = String(item.id);
                if (!id) return null;
                return {
                    id,
                    value: Number(item.value ?? item.defaultValue ?? 0) || 0,
                    operation: (item.operation === 'add' ? 'add' : 'subtract') as 'add' | 'subtract',
                };
            })
            .filter(Boolean) as ApplicableConservationState[];

        return {
            ...device,
            applicableDamageTypes,
            specificPricingPolicies,
            applicableConservationStates,
        };
    };

    const handleSubmitCreateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        setCreateUserLoading(true);
        setCreateUserError('');
        try {
            const response = await fetch(`${API_BASE_URL}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(createUserForm),
            });
            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.message || 'Erro ao criar usuário');
            }
            setIsCreateUserModalOpen(false);
            setCreateUserForm({ name: '', email: '', password: '', role: 'user' });
        } catch (err: any) {
            setCreateUserError(err.message || 'Erro ao criar usuário');
        } finally {
            setCreateUserLoading(false);
        }
    };

    const handleOpenModal = (device?: Device) => {
        if (device) {
            setEditingDevice(device);
            setFormData(normalizeDeviceForForm(device));
        } else {
            setEditingDevice(null);
            setFormData(emptyDevice);
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingDevice(null);
        setFormData(emptyDevice);
    };

    const handleOpenPricingModal = () => {
        setPricingFormData(emptyPricingPolicy);
        setIsPricingModalOpen(true);
    };

    const handleClosePricingModal = () => {
        setIsPricingModalOpen(false);
        setPricingFormData(emptyPricingPolicy);
    };

    const handleOpenDamageTypeModal = () => {
        setDamageTypeFormData(emptyDamageType);
        setIsDamageTypeModalOpen(true);
    };

    const handleCloseDamageTypeModal = () => {
        setIsDamageTypeModalOpen(false);
        setDamageTypeFormData(emptyDamageType);
    };

    const handleOpenConservationStateModal = () => {
        setConservationStateFormData(emptyConservationState);
        setIsConservationStateModalOpen(true);
    };

    const handleCloseConservationStateModal = () => {
        setIsConservationStateModalOpen(false);
        setConservationStateFormData(emptyConservationState);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const url = editingDevice
                ? `${API_BASE_URL}/devices/${editingDevice._id}`
                : `${API_BASE_URL}/devices`;

            const method = editingDevice ? 'PATCH' : 'POST';

            const payload = {
                name: formData.name,
                brand: formData.brand,
                description: formData.description,
                isActive: !!formData.isActive,
                variants: (formData.variants || []).map(v => ({
                    model: v.model,
                    memory: v.memory,
                    price: Number(v.price) || 0,
                    sku: v.sku,
                    isActive: !!v.isActive,
                })),
                specificPricingPolicies: (formData.specificPricingPolicies || [])
                    .map((p: any) => normalizeSpecificPricingPolicyFromApi(p, pricingPolicies))
                    .filter(Boolean)
                    .map(p => ({
                        saleMode: p!.saleMode,
                        paymentTiming: p!.paymentTiming,
                        discountAmount: p!.discountAmount,
                    })),
                applicableDamageTypes: (formData.applicableDamageTypes || [])
                    .map((dt: any) => {
                        const damageTypeId = resolveDamageTypeRefId(dt, damageTypes);
                        return {
                            id: damageTypeId,
                            defaultDiscountPercentage: Number(dt.defaultDiscountPercentage) || 0,
                            operation: dt.operation === 'add' ? 'add' : 'subtract',
                            blocksSubmission: !!dt.blocksSubmission,
                        };
                    })
                    .filter(
                        (row): row is { id: string; defaultDiscountPercentage: number; operation: 'add' | 'subtract' } =>
                            row.id != null && String(row.id) !== ''
                    ),
                applicableConservationStates: (formData.applicableConservationStates || [])
                    .filter(cs => cs.id != null && String(cs.id) !== '')
                    .map(cs => ({
                        id: cs.id,
                        value: Number(cs.value) || 0,
                        operation: cs.operation === 'add' ? 'add' : 'subtract',
                    })),
            };

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });

            if (response.ok) {
                await fetchDevices();
                handleCloseModal();
            }
        } catch (error) {
            console.error('Erro ao salvar dispositivo:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmitPricingPolicy = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const response = await fetch(`${API_BASE_URL}/pricing-policies`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(pricingFormData),
            });

            if (response.ok) {
                await fetchPricingPolicies();
                handleClosePricingModal();
            }
        } catch (error) {
            console.error('Erro ao criar política de preço:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmitDamageType = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const response = await fetch(`${API_BASE_URL}/damage-types`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(damageTypeFormData),
            });

            if (response.ok) {
                await fetchDamageTypes();
                handleCloseDamageTypeModal();
            }
        } catch (error) {
            console.error('Erro ao criar tipo de dano:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmitConservationState = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/conservation-states`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(conservationStateFormData),
            });
            if (response.ok) {
                await fetchConservationStates();
                handleCloseConservationStateModal();
            }
        } catch (error) {
            console.error('Erro ao criar estado de conservação:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (deviceId: string) => {
        if (!confirm('Tem certeza que deseja excluir este dispositivo?')) return;

        try {
            await fetch(`${API_BASE_URL}/devices/${deviceId}`, {
                method: 'DELETE',
            });
            await fetchDevices();
        } catch (error) {
            console.error('Erro ao excluir dispositivo:', error);
        }
    };

    // Funções para gerenciar variantes
    const addVariant = () => {
        setFormData({
            ...formData,
            variants: [
                ...formData.variants,
                { model: '', memory: '', price: 0, sku: '', isActive: true },
            ],
        });
    };

    const updateVariant = (index: number, field: keyof Variant, value: any) => {
        const newVariants = [...formData.variants];
        newVariants[index] = { ...newVariants[index], [field]: value };
        setFormData({ ...formData, variants: newVariants });
    };

    const removeVariant = (index: number) => {
        const newVariants = formData.variants.filter((_, i) => i !== index);
        setFormData({ ...formData, variants: newVariants });
    };

    // Funções para gerenciar políticas de preço
    const addPricingPolicy = (policyId: string) => {
        const policy = pricingPolicies.find(p => p.id === policyId);
        if (!policy) return;

        // Prevent duplicates by saleMode + paymentTiming
        const exists = formData.specificPricingPolicies.some(
            (p) => p.saleMode === policy.saleMode && p.paymentTiming === policy.paymentTiming
        );
        if (exists) return;

        const newPolicy: PricingPolicy = {
            saleMode: policy.saleMode,
            paymentTiming: policy.paymentTiming,
            discountAmount: policy.discountAmount,
        };

        setFormData({
            ...formData,
            specificPricingPolicies: [...formData.specificPricingPolicies, newPolicy],
        });
    };

    const removePricingPolicy = (index: number) => {
        const newPolicies = formData.specificPricingPolicies.filter(
            (_, i) => i !== index
        );
        setFormData({ ...formData, specificPricingPolicies: newPolicies });
    };

    // Funções para gerenciar tipos de dano
    const toggleDamageType = (damageTypeId: string) => {
        const exists = formData.applicableDamageTypes.find(
            dt => dt.id === damageTypeId
        );

        if (exists) {
            setFormData({
                ...formData,
                applicableDamageTypes: formData.applicableDamageTypes.filter(
                    dt => dt.id !== damageTypeId
                ),
            });
        } else {
            const damageType = damageTypes.find(dt => dt.id === damageTypeId);
            if (damageType) {
                setFormData({
                    ...formData,
                    applicableDamageTypes: [
                        ...formData.applicableDamageTypes,
                        {
                            id: damageTypeId,
                            defaultDiscountPercentage: damageType.defaultDiscountPercentage,
                            operation: damageType.operation,
                            blocksSubmission: false,
                        },
                    ],
                });
            }
        }
    };

    const updateDamageTypePercentage = (damageTypeId: string, percentage: number) => {
        const newDamageTypes = formData.applicableDamageTypes.map(dt =>
            dt.id === damageTypeId
                ? { ...dt, defaultDiscountPercentage: percentage }
                : dt
        );
        setFormData({ ...formData, applicableDamageTypes: newDamageTypes });
    };

    const toggleConservationState = (csId: string) => {
        const exists = formData.applicableConservationStates.find(cs => cs.id === csId);
        if (exists) {
            setFormData({
                ...formData,
                applicableConservationStates: formData.applicableConservationStates.filter(cs => cs.id !== csId),
            });
        } else {
            const cs = conservationStates.find(c => c.id === csId);
            if (cs) {
                setFormData({
                    ...formData,
                    applicableConservationStates: [
                        ...formData.applicableConservationStates,
                        { id: csId, value: 0, operation: cs.operation },
                    ],
                });
            }
        }
    };

    const updateConservationStateValue = (csId: string, value: number) => {
        setFormData({
            ...formData,
            applicableConservationStates: formData.applicableConservationStates.map(cs =>
                cs.id === csId ? { ...cs, value } : cs
            ),
        });
    };

    const updateConservationStateOperation = (csId: string, operation: 'add' | 'subtract') => {
        setFormData({
            ...formData,
            applicableConservationStates: formData.applicableConservationStates.map(cs =>
                cs.id === csId ? { ...cs, operation } : cs
            ),
        });
    };

    const updateDamageTypeBlocksSubmission = (damageTypeId: string, blocks: boolean) => {
        setFormData({
            ...formData,
            applicableDamageTypes: formData.applicableDamageTypes.map(dt =>
                dt.id === damageTypeId ? { ...dt, blocksSubmission: blocks } : dt
            ),
        });
    };

    const updateDamageTypeOperation = (damageTypeId: string, operation: 'add' | 'subtract') => {
        const newDamageTypes = formData.applicableDamageTypes.map(dt =>
            dt.id === damageTypeId
                ? { ...dt, operation }
                : dt
        );
        setFormData({ ...formData, applicableDamageTypes: newDamageTypes });
    };

    // Fecha modais com a tecla ESC
    useEffect(() => {
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                if (isConservationStateModalOpen) handleCloseConservationStateModal();
                if (isDamageTypeModalOpen) handleCloseDamageTypeModal();
                if (isPricingModalOpen) handleClosePricingModal();
                if (isModalOpen) handleCloseModal();
            }
        };

        if (isConservationStateModalOpen || isDamageTypeModalOpen || isPricingModalOpen || isModalOpen) {
            window.addEventListener('keydown', onKeyDown);
        }

        return () => {
            window.removeEventListener('keydown', onKeyDown);
        };
    }, [isConservationStateModalOpen, isDamageTypeModalOpen, isPricingModalOpen, isModalOpen]);

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
            <div className="max-w-7xl mx-auto px-4 pt-10 pb-4">
                {/* Header */}
                <div className="mb-8 flex justify-between items-center bg-white/80 backdrop-blur-sm border border-gray-100 rounded-xl p-6 shadow-sm">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">
                            Gerenciar Dispositivos
                        </h1>
                        <p className="text-gray-600">
                            Adicionar, editar e remover dispositivos do catálogo
                        </p>
                    </div>
                    <div className="flex gap-3 items-center">
                        {isAdmin && (
                        <div className="flex gap-3">
                            <Button
                                onClick={handleOpenConservationStateModal}
                                variant="outline"
                                className="flex items-center gap-2 text-gray-800 hover:text-gray-900"
                            >
                                <Package className="h-4 w-4" />
                                Novo Estado de Conservação
                            </Button>
                            <Button
                                onClick={handleOpenDamageTypeModal}
                                variant="outline"
                                className="flex items-center gap-2 text-gray-800 hover:text-gray-900"
                            >
                                <AlertTriangle className="h-4 w-4" />
                                Novo Tipo de Dano
                            </Button>
                            <Button
                                onClick={handleOpenPricingModal}
                                variant="outline"
                                className="flex items-center gap-2 text-gray-800 hover:text-gray-900"
                            >
                                <DollarSign className="h-4 w-4" />
                                Nova Política de Preço
                            </Button>
                            <Button onClick={() => handleOpenModal()} className="flex items-center gap-2">
                                <Plus className="h-4 w-4" />
                                Adicionar Dispositivo
                            </Button>
                        </div>
                        )}
                        {isAdmin && (
                            <Button
                                variant="outline"
                                onClick={() => setIsCreateUserModalOpen(true)}
                                className="flex items-center gap-2 text-blue-700 border-blue-300 hover:bg-blue-50"
                            >
                                <UserPlus className="h-4 w-4" />
                                Criar Usuário
                            </Button>
                        )}
                        <Button
                            variant="outline"
                            onClick={handleLogout}
                            className="flex items-center gap-2 text-red-600 border-red-300 hover:bg-red-50"
                        >
                            <LogOut className="h-4 w-4" />
                            Sair
                        </Button>
                    </div>
                </div>

                {/* Filtro por modelo */}
                <div className="relative mb-4">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                    <input
                        type="text"
                        placeholder="Filtrar por modelo..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white shadow-sm"
                    />
                    {search && (
                        <button
                            onClick={() => setSearch('')}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    )}
                </div>

            </div>

            {/* Lista de dispositivos — planilha, largura total */}
            {devices.length === 0 ? (
                    <Card className="text-center p-12 bg-gradient-to-br from-blue-50 to-indigo-50 border-0 shadow-lg rounded-2xl">
                        <CardContent>
                            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 mb-2">
                                Nenhum dispositivo cadastrado
                            </h3>
                            <p className="text-gray-600 mb-6">
                                Comece adicionando seu primeiro dispositivo
                            </p>
                            <Button onClick={() => handleOpenModal()}>
                                Adicionar Dispositivo
                            </Button>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-sm mx-2.5">
                        <table className="text-xs border-collapse" style={{ borderSpacing: 0 }}>
                            <thead>
                                <tr className="bg-gray-100 text-left border-b-2 border-gray-300">
                                    <th className="px-3 py-2.5 font-semibold text-gray-700 whitespace-nowrap border-r border-gray-200 sticky left-0 bg-gray-100 z-10">Dispositivo</th>
                                    <th className="px-3 py-2.5 font-semibold text-gray-700 whitespace-nowrap border-r border-gray-200">Marca</th>
                                    <th className="px-3 py-2.5 font-semibold text-gray-700 whitespace-nowrap border-r border-gray-200">Modelo</th>
                                    <th className="px-3 py-2.5 font-semibold text-gray-700 whitespace-nowrap border-r border-gray-200">Memória</th>
                                    <th className="px-3 py-2.5 font-semibold text-gray-700 whitespace-nowrap border-r border-gray-200">Preço</th>
                                    <th className="px-3 py-2.5 font-semibold text-gray-700 whitespace-nowrap border-r border-gray-200">Status</th>
                                    {[...damageTypes].sort((a, b) => (a.operation === 'add' ? 0 : 1) - (b.operation === 'add' ? 0 : 1)).map(dt => (
                                        <th key={dt.id} className={`px-3 py-2.5 font-semibold whitespace-nowrap border-r border-gray-200 text-center ${dt.operation === 'add' ? 'bg-green-50 text-green-700' : 'bg-orange-50 text-orange-700'}`}>
                                            {dt.name}
                                        </th>
                                    ))}
                                    {isAdmin && <th className="px-3 py-2.5 font-semibold text-gray-700 whitespace-nowrap">Ações</th>}
                                </tr>
                            </thead>
                            <tbody>
                                {[...devices].filter(device => {
                                    if (!search.trim()) return true;
                                    const q = search.trim().toLowerCase();
                                    if (device.name.toLowerCase().includes(q)) return true;
                                    return device.variants.some(v =>
                                        v.model?.toLowerCase().includes(q) || v.memory?.toLowerCase().includes(q)
                                    );
                                }).sort((a, b) => {
                                    const num = (name: string) => { const m = name.match(/(\d+)/); return m ? parseInt(m[1]) : -1; };
                                    return num(b.name) - num(a.name);
                                }).map((device, deviceIdx) => {
                                    const rows = device.variants.length > 0 ? device.variants : [null];
                                    return rows.map((variant, varIdx) => (
                                        <tr
                                            key={`${device._id}-${varIdx}`}
                                            className={`border-b border-gray-100 hover:bg-yellow-50 transition-colors ${deviceIdx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}
                                        >
                                            {/* Dispositivo — exibe apenas na primeira linha do grupo */}
                                            {varIdx === 0 && (
                                                <td
                                                    rowSpan={rows.length}
                                                    className="px-3 py-2 font-semibold text-gray-900 border-r border-gray-200 align-top sticky left-0 z-10 whitespace-nowrap"
                                                    style={{ backgroundColor: deviceIdx % 2 === 0 ? '#fff' : '#f9fafb' }}
                                                >
                                                    {device.name}
                                                </td>
                                            )}
                                            {varIdx === 0 && (
                                                <td
                                                    rowSpan={rows.length}
                                                    className="px-3 py-2 text-gray-600 border-r border-gray-200 align-top whitespace-nowrap"
                                                >
                                                    {device.brand}
                                                </td>
                                            )}

                                            {/* Modelo */}
                                            <td className="px-3 py-2 text-gray-700 border-r border-gray-200 whitespace-nowrap">
                                                {variant?.model || '—'}
                                            </td>
                                            {/* Memória */}
                                            <td className="px-3 py-2 text-gray-700 border-r border-gray-200 whitespace-nowrap">
                                                {variant?.memory || '—'}
                                            </td>
                                            {/* Preço */}
                                            <td className="px-3 py-2 text-gray-700 border-r border-gray-200 whitespace-nowrap font-medium">
                                                {variant?.price != null
                                                    ? `R$ ${Number(variant.price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                                                    : '—'}
                                            </td>
                                            {/* Status da variante */}
                                            <td className="px-3 py-2 border-r border-gray-200 whitespace-nowrap">
                                                {variant ? (
                                                    <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${variant.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                                        {variant.isActive ? 'Ativo' : 'Inativo'}
                                                    </span>
                                                ) : (
                                                    <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${device.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                                        {device.isActive ? 'Ativo' : 'Inativo'}
                                                    </span>
                                                )}
                                            </td>

                                            {/* Colunas de tipos de dano */}
                                            {[...damageTypes].sort((a, b) => (a.operation === 'add' ? 0 : 1) - (b.operation === 'add' ? 0 : 1)).map(dt => {
                                                const applicable = (device.applicableDamageTypes as any[]).find(adt => {
                                                    const adtId = adt.damageType?._id ?? adt.damageType?.id ?? adt.id;
                                                    return String(adtId) === String(dt.id);
                                                });
                                                const discountValue: number | null = applicable
                                                    ? Number(applicable.defaultDiscountPercentage ?? 0)
                                                    : null;
                                                const op: 'add' | 'subtract' = applicable?.operation === 'add' ? 'add' : 'subtract';
                                                return (
                                                    <td key={dt.id} className="px-3 py-2 border-r border-gray-200 text-center whitespace-nowrap bg-orange-50/30">
                                                        {applicable ? (
                                                            applicable.blocksSubmission ? (
                                                                <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-red-600 text-white font-bold text-xs">✕</span>
                                                            ) : (
                                                                <span className={`font-semibold ${op === 'subtract' ? 'text-red-700' : 'text-green-700'}`}>
                                                                    {op === 'subtract' ? '−' : '+'}R$ {(discountValue ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                                                </span>
                                                            )
                                                        ) : (
                                                            <span className="text-gray-300">—</span>
                                                        )}
                                                    </td>
                                                );
                                            })}

                                            {/* Ações — exibe apenas na primeira linha do grupo e apenas para admins */}
                                            {isAdmin && varIdx === 0 && (
                                                <td rowSpan={rows.length} className="px-3 py-2 align-top whitespace-nowrap">
                                                    <div className="flex gap-1">
                                                        <Button variant="outline" size="sm" onClick={() => handleOpenModal(device)} className="border-gray-500 text-gray-800 hover:bg-gray-200">
                                                            <Edit2 className="h-3.5 w-3.5" />
                                                        </Button>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => device._id && handleDelete(device._id)}
                                                            className="text-red-600 hover:text-red-700"
                                                        >
                                                            <Trash2 className="h-3.5 w-3.5" />
                                                        </Button>
                                                    </div>
                                                </td>
                                            )}
                                        </tr>
                                    ));
                                })}
                            </tbody>
                        </table>
                    </div>
                )}

            <div className="pb-10" />

                {/* Modal Criar Usuário */}
                {isCreateUserModalOpen && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" onClick={() => setIsCreateUserModalOpen(false)}>
                        <Card className="w-full max-w-md rounded-xl shadow-2xl" onClick={e => e.stopPropagation()}>
                            <div className="p-6">
                                <div className="flex justify-between items-center mb-6">
                                    <h2 className="text-2xl font-bold text-gray-900">Criar Usuário</h2>
                                    <button onClick={() => setIsCreateUserModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                                        <X className="h-6 w-6" />
                                    </button>
                                </div>
                                <form onSubmit={handleSubmitCreateUser} className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
                                        <input
                                            type="text"
                                            required
                                            value={createUserForm.name}
                                            onChange={e => setCreateUserForm(f => ({ ...f, name: e.target.value }))}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                        <input
                                            type="email"
                                            required
                                            value={createUserForm.email}
                                            onChange={e => setCreateUserForm(f => ({ ...f, email: e.target.value }))}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Senha</label>
                                        <input
                                            type="password"
                                            required
                                            value={createUserForm.password}
                                            onChange={e => setCreateUserForm(f => ({ ...f, password: e.target.value }))}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Perfil</label>
                                        <select
                                            value={createUserForm.role}
                                            onChange={e => setCreateUserForm(f => ({ ...f, role: e.target.value }))}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        >
                                            <option value="user">Usuário</option>
                                            <option value="admin">Admin</option>
                                        </select>
                                    </div>
                                    {createUserError && (
                                        <p className="text-sm text-red-600">{createUserError}</p>
                                    )}
                                    <div className="flex justify-end gap-3 pt-2">
                                        <Button type="button" variant="outline" onClick={() => setIsCreateUserModalOpen(false)}>
                                            <X className="h-4 w-4" />
                                        </Button>
                                        <Button type="submit" disabled={createUserLoading}>
                                            <Save className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </form>
                            </div>
                        </Card>
                    </div>
                )}

                {/* Modal de Estado de Conservação */}
                {isConservationStateModalOpen && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" onClick={handleCloseConservationStateModal}>
                        <Card className="w-full max-w-md rounded-xl shadow-2xl" onClick={(e) => e.stopPropagation()}>
                            <div className="p-6">
                                <div className="flex justify-between items-center mb-6">
                                    <h2 className="text-2xl font-bold text-gray-900">
                                        Novo Estado de Conservação
                                    </h2>
                                    <button onClick={handleCloseConservationStateModal} className="text-gray-400 hover:text-gray-600">
                                        <X className="h-6 w-6" />
                                    </button>
                                </div>

                                <form onSubmit={handleSubmitConservationState} className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Nome *
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            value={conservationStateFormData.name}
                                            onChange={e => setConservationStateFormData({ ...conservationStateFormData, name: e.target.value })}
                                            placeholder="Ex: Excelente, Regular, Usado"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Operação padrão no Valor Final *
                                        </label>
                                        <select
                                            required
                                            value={conservationStateFormData.operation}
                                            onChange={e => setConservationStateFormData({ ...conservationStateFormData, operation: e.target.value as 'add' | 'subtract' })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        >
                                            <option value="subtract">Diminuir do valor final</option>
                                            <option value="add">Somar ao valor final</option>
                                        </select>
                                        <p className="mt-1 text-xs text-gray-500">
                                            Pode ser ajustado individualmente por dispositivo
                                        </p>
                                    </div>

                                    <div className="flex justify-end gap-3 pt-4">
                                        <Button type="button" variant="outline" onClick={handleCloseConservationStateModal}>
                                            Cancelar
                                        </Button>
                                        <Button type="submit" disabled={loading}>
                                            <Save className="h-4 w-4 mr-2" />
                                            {loading ? 'Salvando...' : 'Criar Estado'}
                                        </Button>
                                    </div>
                                </form>
                            </div>
                        </Card>
                    </div>
                )}

                {/* Modal de Tipo de Dano */}
                {isDamageTypeModalOpen && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" onClick={handleCloseDamageTypeModal}>
                        <Card className="w-full max-w-md rounded-xl shadow-2xl" onClick={(e) => e.stopPropagation()}>
                            <div className="p-6">
                                <div className="flex justify-between items-center mb-6">
                                    <h2 className="text-2xl font-bold text-gray-900">
                                        Novo Tipo de Dano
                                    </h2>
                                    <button
                                        onClick={handleCloseDamageTypeModal}
                                        className="text-gray-400 hover:text-gray-600"
                                    >
                                        <X className="h-6 w-6" />
                                    </button>
                                </div>

                                <form onSubmit={handleSubmitDamageType} className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Nome do Tipo de Dano *
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            value={damageTypeFormData.name}
                                            onChange={e =>
                                                setDamageTypeFormData({
                                                    ...damageTypeFormData,
                                                    name: e.target.value,
                                                })
                                            }
                                            placeholder="Ex: Tela Quebrada"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Operação no Valor Final *
                                        </label>
                                        <select
                                            required
                                            value={damageTypeFormData.operation}
                                            onChange={e =>
                                                setDamageTypeFormData({
                                                    ...damageTypeFormData,
                                                    operation: e.target.value as 'add' | 'subtract',
                                                })
                                            }
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        >
                                            <option value="subtract">Diminuir do valor final</option>
                                            <option value="add">Somar ao valor final</option>
                                        </select>
                                        <p className="mt-1 text-xs text-gray-500">
                                            Define se este dano reduz ou acrescenta ao valor do aparelho
                                        </p>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Valor (R$) *
                                        </label>
                                        <input
                                            type="number"
                                            required
                                            step="0.01"
                                            min="0"
                                            max="10000"
                                            value={damageTypeFormData.defaultDiscountPercentage || ''}
                                            onChange={e =>
                                                setDamageTypeFormData({
                                                    ...damageTypeFormData,
                                                    defaultDiscountPercentage: parseFloat(e.target.value) || 0,
                                                })
                                            }
                                            placeholder="0.00"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                        <p className="mt-1 text-xs text-gray-500">
                                            Valor entre 0 e 10000
                                        </p>
                                    </div>

                                    <div className="flex justify-end gap-3 pt-4">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={handleCloseDamageTypeModal}
                                        >
                                            Cancelar
                                        </Button>
                                        <Button type="submit" disabled={loading}>
                                            <Save className="h-4 w-4 mr-2" />
                                            {loading ? 'Salvando...' : 'Criar Tipo de Dano'}
                                        </Button>
                                    </div>
                                </form>
                            </div>
                        </Card>
                    </div>
                )}

                {/* Modal de Política de Preço */}
                {isPricingModalOpen && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" onClick={handleClosePricingModal}>
                        <Card className="w-full max-w-md rounded-xl shadow-2xl" onClick={(e) => e.stopPropagation()}>
                            <div className="p-6">
                                <div className="flex justify-between items-center mb-6">
                                    <h2 className="text-2xl font-bold text-gray-900">
                                        Nova Política de Preço
                                    </h2>
                                    <button
                                        onClick={handleClosePricingModal}
                                        className="text-gray-400 hover:text-gray-600"
                                    >
                                        <X className="h-6 w-6" />
                                    </button>
                                </div>

                                <form onSubmit={handleSubmitPricingPolicy} className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Nome da Política *
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            value={pricingFormData.name}
                                            onChange={e =>
                                                setPricingFormData({
                                                    ...pricingFormData,
                                                    name: e.target.value,
                                                })
                                            }
                                            placeholder="Ex: Desconto à Vista"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Modo de Venda *
                                        </label>
                                        <select
                                            required
                                            value={pricingFormData.saleMode}
                                            onChange={e =>
                                                setPricingFormData({
                                                    ...pricingFormData,
                                                    saleMode: e.target.value,
                                                })
                                            }
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        >
                                            <option value="">Selecione...</option>
                                            <option value="sale">Venda</option>
                                            <option value="exchange">Troca</option>
                                            <option value="buyback">Recompra</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Prazo de Pagamento *
                                        </label>
                                        <select
                                            required
                                            value={pricingFormData.paymentTiming}
                                            onChange={e =>
                                                setPricingFormData({
                                                    ...pricingFormData,
                                                    paymentTiming: e.target.value,
                                                })
                                            }
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        >
                                            <option value="">Selecione...</option>
                                            <option value="seven_days">7 dias</option>
                                            <option value="ten_days">10 dias</option>
                                            <option value="thirty_days">30 dias</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Valor do Desconto (R$) *
                                        </label>
                                        <input
                                            type="number"
                                            required
                                            step="0.01"
                                            min="0"
                                            value={pricingFormData.discountAmount || ''}
                                            onChange={e =>
                                                setPricingFormData({
                                                    ...pricingFormData,
                                                    discountAmount: parseFloat(e.target.value) || 0,
                                                })
                                            }
                                            placeholder="0.00"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>

                                    <div className="flex justify-end gap-3 pt-4">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={handleClosePricingModal}
                                        >
                                            Cancelar
                                        </Button>
                                        <Button type="submit" disabled={loading}>
                                            <Save className="h-4 w-4 mr-2" />
                                            {loading ? 'Salvando...' : 'Criar Política'}
                                        </Button>
                                    </div>
                                </form>
                            </div>
                        </Card>
                    </div>
                )}

                {/* Modal de edição/criação de dispositivo */}
                {isModalOpen && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto" onClick={handleCloseModal}>
                        <Card className="w-full max-w-4xl my-8 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                            <div className="p-6">
                                <div className="flex justify-between items-center mb-6">
                                    <h2 className="text-2xl font-bold text-gray-900">
                                        {editingDevice ? 'Editar Dispositivo' : 'Novo Dispositivo'}
                                    </h2>
                                    <button
                                        onClick={handleCloseModal}
                                        className="text-gray-400 hover:text-gray-600"
                                    >
                                        <X className="h-6 w-6" />
                                    </button>
                                </div>

                                <form onSubmit={handleSubmit} className="space-y-6">
                                    {/* Informações básicas */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Nome *
                                            </label>
                                            <input
                                                type="text"
                                                required
                                                value={formData.name}
                                                onChange={e =>
                                                    setFormData({ ...formData, name: e.target.value })
                                                }
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Marca *
                                            </label>
                                            <input
                                                type="text"
                                                required
                                                value={formData.brand}
                                                onChange={e =>
                                                    setFormData({ ...formData, brand: e.target.value })
                                                }
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Descrição
                                        </label>
                                        <textarea
                                            value={formData.description}
                                            onChange={e =>
                                                setFormData({ ...formData, description: e.target.value })
                                            }
                                            rows={3}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>

                                    <div className="flex items-center">
                                        <input
                                            type="checkbox"
                                            checked={formData.isActive}
                                            onChange={e =>
                                                setFormData({ ...formData, isActive: e.target.checked })
                                            }
                                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                        />
                                        <label className="ml-2 block text-sm text-gray-700">
                                            Dispositivo ativo
                                        </label>
                                    </div>

                                    {/* Variantes */}
                                    <div className="border-t pt-6">
                                        <div className="flex justify-between items-center mb-4">
                                            <h3 className="text-lg font-semibold text-gray-900">
                                                Variantes
                                            </h3>
                                            <Button
                                                type="button"
                                                onClick={addVariant}
                                                size="sm"
                                                variant="outline"
                                            >
                                                <Plus className="h-4 w-4 mr-1" />
                                                Adicionar Variante
                                            </Button>
                                        </div>

                                        <div className="space-y-4">
                                            {formData.variants.map((variant, index) => (
                                                <div
                                                    key={index}
                                                    className="p-4 border border-gray-200 rounded-lg relative"
                                                >
                                                    <button
                                                        type="button"
                                                        onClick={() => removeVariant(index)}
                                                        className="absolute top-2 right-2 text-red-600 hover:text-red-700"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>

                                                    <div className="grid grid-cols-2 gap-4 pr-8">
                                                        <div>
                                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                                Modelo *
                                                            </label>
                                                            <input
                                                                type="text"
                                                                required
                                                                value={variant.model}
                                                                onChange={e =>
                                                                    updateVariant(index, 'model', e.target.value)
                                                                }
                                                                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                            />
                                                        </div>

                                                        <div>
                                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                                Memória *
                                                            </label>
                                                            <input
                                                                type="text"
                                                                required
                                                                value={variant.memory}
                                                                onChange={e =>
                                                                    updateVariant(index, 'memory', e.target.value)
                                                                }
                                                                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                            />
                                                        </div>

                                                        <div>
                                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                                Preço *
                                                            </label>
                                                            <input
                                                                type="number"
                                                                required
                                                                step="0.01"
                                                                value={variant.price || ''}
                                                                onChange={e =>
                                                                    updateVariant(
                                                                        index,
                                                                        'price',
                                                                        parseFloat(e.target.value) || 0
                                                                    )
                                                                }
                                                                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                            />
                                                        </div>

                                                        <div>
                                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                                SKU *
                                                            </label>
                                                            <input
                                                                type="text"
                                                                required
                                                                value={variant.sku}
                                                                onChange={e =>
                                                                    updateVariant(index, 'sku', e.target.value)
                                                                }
                                                                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                            />
                                                        </div>

                                                        <div className="col-span-2 flex items-center">
                                                            <input
                                                                type="checkbox"
                                                                checked={variant.isActive}
                                                                onChange={e =>
                                                                    updateVariant(index, 'isActive', e.target.checked)
                                                                }
                                                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                                            />
                                                            <label className="ml-2 block text-sm text-gray-700">
                                                                Variante ativa
                                                            </label>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Políticas de Preço */}
                                    <div className="border-t pt-6">
                                        <h3 className="text-lg font-semibold text-gray-900 mb-4">
                                            Políticas de Preço Específicas
                                        </h3>

                                        <div className="mb-4">
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Adicionar Política
                                            </label>
                                            <select
                                                onChange={e => {
                                                    if (e.target.value) {
                                                        addPricingPolicy(e.target.value);
                                                        e.target.value = '';
                                                    }
                                                }}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            >
                                                <option value="">Selecione uma política...</option>
                                                {pricingPolicies.map(policy => (
                                                    <option key={policy.id} value={policy.id}>
                                                        {policy.name} - {policy.saleMode} / {policy.paymentTiming}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        <div className="space-y-2">
                                            {formData.specificPricingPolicies.map((policy, index) => (
                                                <div
                                                    key={index}
                                                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                                                >
                                                    <div className="text-sm">
                            <span className="font-medium text-gray-700">
                              {policy.saleMode} / {policy.paymentTiming}
                            </span>
                                                        <span className="ml-3 text-gray-600">
                              Desconto: R$ {policy.discountAmount.toFixed(2)}
                            </span>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => removePricingPolicy(index)}
                                                        className="text-red-600 hover:text-red-700"
                                                    >
                                                        <X className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Tipos de Dano */}
                                    <div className="border-t pt-6">
                                        <h3 className="text-lg font-semibold text-gray-900 mb-4">
                                            Tipos de Dano Aplicáveis
                                        </h3>

                                        <div className="space-y-3">
                                            {damageTypes.map(damageType => {
                                                const selected = formData.applicableDamageTypes.find(
                                                    dt => dt.id === damageType.id
                                                );

                                                return (
                                                    <div
                                                        key={damageType.id}
                                                        className="flex items-center justify-between p-3 border border-gray-200 rounded-lg"
                                                    >
                                                        <div className="flex items-center flex-1">
                                                            <input
                                                                type="checkbox"
                                                                checked={!!selected}
                                                                onChange={() => toggleDamageType(damageType.id)}
                                                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                                            />
                                                            <label className="ml-3 text-sm font-medium text-gray-700">
                                                                {damageType.name}
                                                            </label>
                                                        </div>

                                                        {selected && (
                                                            <div className="flex flex-col gap-2 items-end">
                                                                <div className="flex items-center gap-2">
                                                                    <select
                                                                        value={selected.operation}
                                                                        onChange={e =>
                                                                            updateDamageTypeOperation(
                                                                                damageType.id,
                                                                                e.target.value as 'add' | 'subtract'
                                                                            )
                                                                        }
                                                                        className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                                    >
                                                                        <option value="subtract">- Diminuir</option>
                                                                        <option value="add">+ Somar</option>
                                                                    </select>
                                                                    <label className="text-sm text-gray-600">R$:</label>
                                                                    <input
                                                                        type="number"
                                                                        step="0.01"
                                                                        min="0"
                                                                        max="10000"
                                                                        value={selected.defaultDiscountPercentage || ''}
                                                                        onChange={e =>
                                                                            updateDamageTypePercentage(
                                                                                damageType.id,
                                                                                parseFloat(e.target.value) || 0
                                                                            )
                                                                        }
                                                                        className="w-24 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                                    />
                                                                </div>
                                                                <label className="flex items-center gap-2 cursor-pointer select-none">
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={selected.blocksSubmission}
                                                                        onChange={e =>
                                                                            updateDamageTypeBlocksSubmission(
                                                                                damageType.id,
                                                                                e.target.checked
                                                                            )
                                                                        }
                                                                        className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                                                                    />
                                                                    <span className="text-xs font-medium text-red-600">
                                                                        Bloqueia submissão
                                                                    </span>
                                                                </label>
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* Estados de Conservação */}
                                    <div className="border-t pt-6">
                                        <h3 className="text-lg font-semibold text-gray-900 mb-4">
                                            Estados de Conservação
                                        </h3>

                                        {conservationStates.length === 0 ? (
                                            <p className="text-sm text-gray-500">
                                                Nenhum estado de conservação cadastrado. Crie um clicando em "Novo Estado de Conservação".
                                            </p>
                                        ) : (
                                            <div className="space-y-3">
                                                {conservationStates.map(cs => {
                                                    const selected = formData.applicableConservationStates.find(s => s.id === cs.id);
                                                    return (
                                                        <div key={cs.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                                                            <div className="flex items-center flex-1">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={!!selected}
                                                                    onChange={() => toggleConservationState(cs.id)}
                                                                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                                                />
                                                                <label className="ml-3 text-sm font-medium text-gray-700">
                                                                    {cs.name}
                                                                </label>
                                                            </div>
                                                            {selected && (
                                                                <div className="flex items-center gap-2">
                                                                    <select
                                                                        value={selected.operation}
                                                                        onChange={e => updateConservationStateOperation(cs.id, e.target.value as 'add' | 'subtract')}
                                                                        className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                                    >
                                                                        <option value="subtract">- Diminuir</option>
                                                                        <option value="add">+ Somar</option>
                                                                    </select>
                                                                    <label className="text-sm text-gray-600">R$:</label>
                                                                    <input
                                                                        type="number"
                                                                        step="0.01"
                                                                        min="0"
                                                                        value={selected.value || ''}
                                                                        onChange={e => updateConservationStateValue(cs.id, parseFloat(e.target.value) || 0)}
                                                                        className="w-24 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                                    />
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>

                                    {/* Botões de ação */}
                                    <div className="flex justify-end gap-3 pt-6 border-t">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={handleCloseModal}
                                        >
                                            Cancelar
                                        </Button>
                                        <Button type="submit" disabled={loading}>
                                            <Save className="h-4 w-4 mr-2" />
                                            {loading
                                                ? 'Salvando...'
                                                : editingDevice
                                                    ? 'Atualizar'
                                                    : 'Criar'}
                                        </Button>
                                    </div>
                                </form>
                            </div>
                        </Card>
                    </div>
                )}
        </div>
    );
}
