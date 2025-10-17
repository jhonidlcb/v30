import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/api";
import { Building2, Save, FileText, AlertCircle, CheckCircle, User, MapPin } from "lucide-react";

interface ClientBillingInfo {
  id?: number;
  clientType: string;
  legalName: string;
  documentType: string;
  documentNumber: string;
  additionalRuc?: string;
  address?: string;
  city?: string;
  department?: string;
  country: string;
  email?: string;
  phone?: string;
  observations?: string;
  isDefault: boolean;
}

const DEPARTAMENTOS_PARAGUAY = [
  'Central',
  'Itapúa',
  'Alto Paraná',
  'Caaguazú',
  'Caazapá',
  'Canindeyú',
  'Concepción',
  'Cordillera',
  'Guairá',
  'Misiones',
  'Ñeembucú',
  'Paraguarí',
  'Presidente Hayes',
  'San Pedro',
  'Amambay',
  'Boquerón',
  'Alto Paraguay'
];

const CIUDADES_PRINCIPALES = [
  'Asunción',
  'Ciudad del Este',
  'San Lorenzo',
  'Luque',
  'Capiatá',
  'Lambaré',
  'Fernando de la Mora',
  'Nemby',
  'Encarnación',
  'Pedro Juan Caballero',
  'Caaguazú',
  'Coronel Oviedo',
  'Concepción',
  'Villarrica',
  'Mariano Roque Alonso',
  'Itauguá',
  'Ñemby',
  'Villa Elisa',
  'San Antonio',
  'Caacupé'
];

export default function BillingInformation() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);

  const { data: billingInfo, isLoading } = useQuery({
    queryKey: ["/api/client/billing-info"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/client/billing-info");
      if (!response.ok) {
        if (response.status === 404) {
          return null; // No tiene datos de facturación aún
        }
        throw new Error('Error al cargar datos de facturación');
      }
      return await response.json();
    },
  });

  const updateBillingInfoMutation = useMutation({
    mutationFn: async (data: ClientBillingInfo) => {
      const method = billingInfo ? "PUT" : "POST";
      const url = billingInfo
        ? `/api/client/billing-info/${billingInfo.id}`
        : "/api/client/billing-info";

      const response = await apiRequest(method, url, data);
      if (!response.ok) throw new Error('Error al guardar datos de facturación');
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/client/billing-info"] });
      toast({
        title: "✅ Datos guardados",
        description: "Tus datos de facturación han sido actualizados correctamente",
      });
      setIsEditing(false);
    },
    onError: (error: any) => {
      toast({
        title: "❌ Error al guardar",
        description: error.message || "No se pudieron guardar los datos",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);

    const data: ClientBillingInfo = {
      clientType: formData.get('clientType') as string,
      legalName: formData.get('legalName') as string,
      documentType: formData.get('documentType') as string,
      documentNumber: formData.get('documentNumber') as string,
      additionalRuc: formData.get('additionalRuc') as string,
      address: formData.get('address') as string,
      city: formData.get('city') as string,
      department: formData.get('department') as string,
      country: formData.get('country') as string,
      email: formData.get('email') as string,
      phone: formData.get('phone') as string,
      observations: formData.get('observations') as string,
      isDefault: true,
    };

    updateBillingInfoMutation.mutate(data);
  };

  if (isLoading) {
    return (
      <DashboardLayout title="Datos de Facturación">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="h-64 bg-muted rounded"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Datos de Facturación">
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Building2 className="h-12 w-12 text-primary mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-foreground mb-2">Datos de Facturación</h1>
            <p className="text-muted-foreground">
              Configura tus datos completos para la emisión de facturas según normativas SET Paraguay
            </p>
          </motion.div>
        </div>

        {/* Alert Information */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="p-4">
              <div className="flex items-start space-x-3">
                <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-blue-800">
                  <p className="font-medium mb-1">Información importante:</p>
                  <ul className="space-y-1 text-xs">
                    <li>• Estos datos aparecerán en todas las facturas que recibas</li>
                    <li>• Son requeridos según normativas SET Paraguay</li>
                    <li>• El email es obligatorio para el envío de facturas en PDF</li>
                    <li>• Asegúrate de que todos los datos sean correctos</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Billing Information Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Información de Facturación
                </span>
                {billingInfo && !isEditing ? (
                  <Button variant="outline" onClick={() => setIsEditing(true)}>
                    Editar
                  </Button>
                ) : null}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {billingInfo && !isEditing ? (
                // Display Mode
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                        <User className="h-4 w-4" />
                        Tipo de Cliente
                      </Label>
                      <p className="font-medium">
                        {billingInfo.clientType === 'persona_fisica' && 'Persona Física'}
                        {billingInfo.clientType === 'empresa' && 'Empresa'}
                        {billingInfo.clientType === 'consumidor_final' && 'Consumidor Final'}
                        {billingInfo.clientType === 'extranjero' && 'Extranjero'}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">
                        {billingInfo.clientType === 'empresa' ? 'Razón Social' : 'Nombre Completo'}
                      </Label>
                      <p className="font-medium">{billingInfo.legalName}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Documento Principal</Label>
                      <p className="font-medium">{billingInfo.documentType}: {billingInfo.documentNumber}</p>
                    </div>
                    {billingInfo.additionalRuc && (
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">RUC Adicional</Label>
                        <p className="font-medium">{billingInfo.additionalRuc}</p>
                      </div>
                    )}
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Email</Label>
                      <p className="font-medium">{billingInfo.email || 'No especificado'}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Teléfono</Label>
                      <p className="font-medium">{billingInfo.phone || 'No especificado'}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        Ciudad
                      </Label>
                      <p className="font-medium">{billingInfo.city || 'No especificado'}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Departamento</Label>
                      <p className="font-medium">{billingInfo.department || 'No especificado'}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">País</Label>
                      <p className="font-medium">{billingInfo.country}</p>
                    </div>
                  </div>

                  {billingInfo.address && (
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Dirección Completa</Label>
                      <p className="font-medium">{billingInfo.address}</p>
                    </div>
                  )}

                  {billingInfo.observations && (
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Observaciones</Label>
                      <p className="font-medium">{billingInfo.observations}</p>
                    </div>
                  )}

                  <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm text-green-800">Datos de facturación configurados correctamente</span>
                  </div>
                </div>
              ) : (
                // Edit/Create Mode
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="md:col-span-2">
                      <Label htmlFor="clientType">Tipo de Cliente *</Label>
                      <Select name="clientType" defaultValue={billingInfo?.clientType || 'persona_fisica'}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona tipo de cliente" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="persona_fisica">Persona Física</SelectItem>
                          <SelectItem value="empresa">Empresa</SelectItem>
                          <SelectItem value="consumidor_final">Consumidor Final</SelectItem>
                          <SelectItem value="extranjero">Extranjero</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="md:col-span-2">
                      <Label htmlFor="legalName">Nombre Completo / Razón Social *</Label>
                      <Input
                        id="legalName"
                        name="legalName"
                        defaultValue={billingInfo?.legalName || ''}
                        placeholder="Nombre completo o razón social según tipo de cliente"
                        required
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Persona Física: Nombre y Apellido completo | Empresa: Razón Social completa
                      </p>
                    </div>

                    <div>
                      <Label htmlFor="documentType">Tipo de Documento Principal *</Label>
                      <Select name="documentType" defaultValue={billingInfo?.documentType || 'CI'}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona tipo de documento" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="CI">Cédula de Identidad (CI)</SelectItem>
                          <SelectItem value="RUC">RUC</SelectItem>
                          <SelectItem value="Pasaporte">Pasaporte</SelectItem>
                          <SelectItem value="Documento_Extranjero">Documento Extranjero</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="documentNumber">Número de Documento *</Label>
                      <Input
                        id="documentNumber"
                        name="documentNumber"
                        defaultValue={billingInfo?.documentNumber || ''}
                        placeholder="Número sin puntos ni guiones"
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="additionalRuc">RUC Adicional</Label>
                      <Input
                        id="additionalRuc"
                        name="additionalRuc"
                        defaultValue={billingInfo?.additionalRuc || ''}
                        placeholder="RUC adicional (opcional)"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Para personas físicas que también tienen RUC
                      </p>
                    </div>

                    <div>
                      <Label htmlFor="email">Correo Electrónico *</Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        defaultValue={billingInfo?.email || ''}
                        placeholder="correo@ejemplo.com"
                        required
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Obligatorio para envío de facturas en PDF
                      </p>
                    </div>

                    <div>
                      <Label htmlFor="phone">Teléfono de Contacto</Label>
                      <Input
                        id="phone"
                        name="phone"
                        defaultValue={billingInfo?.phone || ''}
                        placeholder="+595 9XX XXX XXX"
                      />
                    </div>

                    <div>
                      <Label htmlFor="city">Ciudad</Label>
                      <Select name="city" defaultValue={billingInfo?.city || ''}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona ciudad" />
                        </SelectTrigger>
                        <SelectContent>
                          {CIUDADES_PRINCIPALES.map((ciudad) => (
                            <SelectItem key={ciudad} value={ciudad}>
                              {ciudad}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="department">Departamento</Label>
                      <Select name="department" defaultValue={billingInfo?.department || ''}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona departamento" />
                        </SelectTrigger>
                        <SelectContent>
                          {DEPARTAMENTOS_PARAGUAY.map((dept) => (
                            <SelectItem key={dept} value={dept}>
                              {dept}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="country">País</Label>
                      <Select name="country" defaultValue={billingInfo?.country || 'Paraguay'}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona país" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Paraguay">Paraguay</SelectItem>
                          <SelectItem value="Argentina">Argentina</SelectItem>
                          <SelectItem value="Brasil">Brasil</SelectItem>
                          <SelectItem value="Uruguay">Uruguay</SelectItem>
                          <SelectItem value="Chile">Chile</SelectItem>
                          <SelectItem value="Bolivia">Bolivia</SelectItem>
                          <SelectItem value="Otro">Otro</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="address">Dirección Completa</Label>
                    <Textarea
                      id="address"
                      name="address"
                      defaultValue={billingInfo?.address || ''}
                      placeholder="Calle, número, barrio, referencias"
                      rows={3}
                    />
                  </div>

                  <div>
                    <Label htmlFor="observations">Observaciones</Label>
                    <Textarea
                      id="observations"
                      name="observations"
                      defaultValue={billingInfo?.observations || ''}
                      placeholder="Notas adicionales: Sucursal Central, Proyecto Web, etc."
                      rows={2}
                    />
                  </div>

                  <div className="flex justify-end space-x-2">
                    {billingInfo && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsEditing(false)}
                      >
                        Cancelar
                      </Button>
                    )}
                    <Button
                      type="submit"
                      disabled={updateBillingInfoMutation.isPending}
                      className="flex items-center gap-2"
                    >
                      <Save className="h-4 w-4" />
                      {updateBillingInfoMutation.isPending ? "Guardando..." : "Guardar Datos"}
                    </Button>
                  </div>
                </form>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </DashboardLayout>
  );
}