import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import AuthModal from "@/components/AuthModal";
import ContactForm from "@/components/ContactForm";
import Layout from "@/components/Layout";
import Footer from "@/components/Footer";
import { usePortfolio } from "@/hooks/usePortfolio";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/api";
import {
  Code,
  Smartphone,
  Cloud,
  TrendingUp,
  Shield,
  HeadphonesIcon,
  Check,
  Star,
  Users,
  CheckCircle,
  Calendar,
} from "lucide-react";

// Placeholder for AnimatedCounter component
// In a real scenario, this would be imported from a library or defined elsewhere.
const AnimatedCounter = ({ value, suffix }: { value: number; suffix?: string }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    setCount(0); // Reset count when value changes
    const animationFrame = requestAnimationFrame(() => {
      let startTime: number | null = null;
      const duration = 1000; // Animation duration in ms

      const step = (timestamp: number) => {
        if (!startTime) startTime = timestamp;
        const elapsed = timestamp - startTime;
        const progress = Math.min(elapsed / duration, 1);
        setCount(Math.floor(progress * value));

        if (progress < 1) {
          requestAnimationFrame(step);
        } else {
          setCount(value); // Ensure final value is exact
        }
      };
      requestAnimationFrame(step);
    });

    return () => cancelAnimationFrame(animationFrame);
  }, [value]);

  return (
    <>
      {count}
      {suffix}
    </>
  );
};


export default function Landing() {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const { portfolio, isLoading: portfolioLoading } = usePortfolio();

  const { data: workModalities, isLoading: modalitiesLoading, error: modalitiesError } = useQuery({
    queryKey: ["/api/work-modalities"],
    queryFn: async () => {
      try {
        const response = await apiRequest("GET", "/api/work-modalities");
        if (!response.ok) {
          throw new Error('Error al cargar modalidades');
        }
        const data = await response.json();

        console.log("Work modalities loaded:", data);

        return data.map((modality: any) => ({
          ...modality,
          features: typeof modality.features === 'string'
            ? JSON.parse(modality.features)
            : Array.isArray(modality.features)
              ? modality.features
              : []
        }));
      } catch (error) {
        console.error("Error loading work modalities:", error);
        return [];
      }
    },
    retry: 1,
    retryDelay: 2000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  // Manejar navegación automática cuando hay hash en la URL
  useEffect(() => {
    const hash = window.location.hash.replace('#', '');
    if (hash) {
      // Pequeño delay para asegurar que el DOM esté listo
      setTimeout(() => {
        const element = document.getElementById(hash);
        if (element) {
          element.scrollIntoView({ behavior: "smooth" });
        }
      }, 100);
    }
  }, []);


  const openAuthModal = (mode: "login" | "register") => {
    setAuthMode(mode);
    setShowAuthModal(true);
  };

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleWhatsAppContact = () => {
    // Replace with your actual WhatsApp number and message
    const phoneNumber = "+595981123456"; // Example number
    const message = "¡Hola! Quisiera solicitar una cotización.";
    window.open(`https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const services = [
    {
      icon: Code,
      title: "Aplicaciones Web",
      description: "Desarrollo de aplicaciones web modernas con React, Node.js y las últimas tecnologías.",
      features: ["Single Page Applications (SPA)", "APIs RESTful", "Base de datos PostgreSQL"],
    },
    {
      icon: Smartphone,
      title: "Apps Móviles",
      description: "Aplicaciones móviles nativas e híbridas para iOS y Android con diseño intuitivo.",
      features: ["React Native", "Notificaciones Push", "Integración con APIs"],
    },
    {
      icon: Cloud,
      title: "Cloud & DevOps",
      description: "Implementación en la nube con arquitecturas escalables y seguras.",
      features: ["AWS / Google Cloud", "Docker & Kubernetes", "CI/CD Pipeline"],
    },
    {
      icon: TrendingUp,
      title: "Business Intelligence",
      description: "Dashboards y reportes inteligentes para la toma de decisiones estratégicas.",
      features: ["Visualizaciones avanzadas", "Reportes automatizados", "Integración de datos"],
    },
    {
      icon: Shield,
      title: "Ciberseguridad",
      description: "Protegemos tu aplicación con las mejores prácticas de seguridad.",
      features: ["Autenticación JWT", "Encriptación SSL", "Auditorías de seguridad"],
    },
    {
      icon: HeadphonesIcon,
      title: "Soporte & Mantenimiento",
      description: "Soporte técnico continuo y mantenimiento preventivo de tus aplicaciones.",
      features: ["Soporte 24/7", "Actualizaciones regulares", "Monitoreo proactivo"],
    },
  ];

  return (
    <Layout onAuthClick={openAuthModal}>
      {/* Hero Section */}
      <section id="inicio" className="pt-28 pb-20 px-4 sm:px-6 lg:px-8 gradient-bg relative overflow-hidden">
        {/* Background gradient and subtle overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-primary/5 to-primary/20 opacity-70"></div>
        {/* Abstract Tech Illustration - Placeholder */}
        <div className="absolute top-1/4 right-1/4 w-1/2 h-1/2 opacity-30">
          <svg viewBox="0 0 500 500" fill="none" xmlns="http://www.w3.org/2000/svg">
            <g opacity="0.6">
              <circle cx="250" cy="250" r="200" stroke="currentColor" strokeWidth="2" fill="none"/>
              <circle cx="150" cy="150" r="50" stroke="currentColor" strokeWidth="1.5" fill="none"/>
              <circle cx="350" cy="350" r="70" stroke="currentColor" strokeWidth="1.5" fill="none"/>
              <path d="M250 50 L350 150 L250 250 L150 150 Z" stroke="currentColor" strokeWidth="1.5" fill="none"/>
              <path d="M50 250 L150 350 L250 450 L150 250 Z" stroke="currentColor" strokeWidth="1.5" fill="none"/>
              <path d="M350 250 L450 350 L350 450 L250 350 Z" stroke="currentColor" strokeWidth="1.5" fill="none"/>
            </g>
          </svg>
        </div>

        <div className="max-w-6xl mx-auto relative z-10">
          <motion.div
            className="text-center px-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            {/* Badge */}
            <div className="mb-6 inline-block">
              <Badge variant="outline" className="bg-white/10 backdrop-blur-sm text-white px-4 py-2 rounded-full text-sm font-medium border border-white/20">
                🇵🇾 Desarrollo de Software a Medida en Paraguay
              </Badge>
            </div>

            {/* Main Heading */}
            <h1 className="font-sans text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6 tracking-tight drop-shadow-xl leading-tight max-w-4xl mx-auto">
              Desarrollamos aplicaciones web y móviles que hacen crecer tu negocio
            </h1>

            {/* Subtitle */}
            <p className="text-base sm:text-lg md:text-xl text-white/90 mb-8 max-w-2xl mx-auto leading-relaxed font-normal drop-shadow-lg">
              Soporte local • Facturación legal • Resultados garantizados para tu empresa.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center max-w-md mx-auto mb-12">
              <Button
                size="lg"
                onClick={() => scrollToSection('contacto')}
                className="w-full sm:w-auto bg-white text-primary hover:bg-gray-100 hover:text-primary transition-all duration-200 transform hover:scale-105 font-semibold shadow-lg px-8 py-3 text-base"
                data-testid="button-quote"
              >
                <svg
                  viewBox="0 0 24 24"
                  className="h-5 w-5 mr-2"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.785"/>
                </svg>
                Cotización Gratuita
              </Button>
              <Button
                size="lg"
                onClick={() => openAuthModal('login')}
                className="w-full sm:w-auto bg-transparent border-2 border-white text-white hover:bg-white hover:text-primary transition-all duration-200 font-semibold backdrop-blur-sm px-8 py-3 shadow-lg text-base"
                data-testid="button-login"
              >
                <Users className="h-5 w-5 mr-2" />
                Acceso Clientes
              </Button>
            </div>
          </motion.div>

          {/* Hero Stats */}
          <motion.div
            className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto px-4"
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            viewport={{ once: true }}
          >
            <div className="text-center glass-effect p-6 rounded-xl hover:bg-white/20 transition-all duration-300">
              <div className="text-4xl font-bold text-white mb-2 drop-shadow-md">
                <AnimatedCounter value={50} suffix="+" />
              </div>
              <div className="text-sm text-white/95 font-medium drop-shadow-sm">Proyectos Completados</div>
            </div>
            <div className="text-center glass-effect p-6 rounded-xl hover:bg-white/20 transition-all duration-300">
              <div className="text-4xl font-bold text-white mb-2 drop-shadow-md">
                <AnimatedCounter value={98} suffix="%" />
              </div>
              <div className="text-sm text-white/95 font-medium drop-shadow-sm">Satisfacción del Cliente</div>
            </div>
            <div className="text-center glass-effect p-6 rounded-xl hover:bg-white/20 transition-all duration-300">
              <div className="text-4xl font-bold text-white mb-2 drop-shadow-md">24/7</div>
              <div className="text-sm text-white/95 font-medium drop-shadow-sm">Soporte Técnico</div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Services Section */}
      <section id="servicios" className="py-16 px-4 sm:px-6 lg:px-8 bg-background">
        <div className="max-w-7xl mx-auto">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="font-sans text-3xl sm:text-4xl font-bold text-foreground mb-4 tracking-tight">
              Nuestros Servicios
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Ofrecemos soluciones tecnológicas completas para hacer crecer tu negocio
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {services.map((service, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Card className="h-full hover:border-primary/50 transition-all duration-300 hover:shadow-xl group hover-lift bg-card/80 backdrop-blur-sm border-border/50">
                  <CardHeader>
                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors duration-300">
                      <service.icon className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle className="text-xl">{service.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground mb-6">{service.description}</p>
                    <ul className="space-y-2">
                      {service.features.map((feature, featureIndex) => (
                        <li key={featureIndex} className="flex items-center text-sm text-muted-foreground">
                          <Check className="h-4 w-4 text-primary mr-2 flex-shrink-0" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Portfolio Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-background">
        <div className="max-w-7xl mx-auto">
          <motion.div
            className="text-center mb-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="font-sans text-3xl sm:text-4xl font-bold text-foreground mb-4 tracking-tight">
              Nuestros Últimos Trabajos
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto font-medium">
              Conoce algunos de los proyectos exitosos que hemos desarrollado para nuestros clientes
            </p>
          </motion.div>

          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            {portfolioLoading ? (
              // Loading skeletons
              Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="rounded-xl bg-card border border-border/50 overflow-hidden">
                  <div className="aspect-video bg-muted animate-pulse"></div>
                  <div className="p-6 space-y-3">
                    <div className="flex justify-between">
                      <div className="h-6 bg-muted rounded animate-pulse w-20"></div>
                      <div className="flex space-x-2">
                        <div className="h-5 bg-muted rounded animate-pulse w-12"></div>
                        <div className="h-5 bg-muted rounded animate-pulse w-16"></div>
                      </div>
                    </div>
                    <div className="h-6 bg-muted rounded animate-pulse w-3/4"></div>
                    <div className="h-16 bg-muted rounded animate-pulse"></div>
                    <div className="flex justify-between">
                      <div className="h-4 bg-muted rounded animate-pulse w-32"></div>
                      <div className="h-8 bg-muted rounded animate-pulse w-20"></div>
                    </div>
                  </div>
                </div>
              ))
            ) : portfolio && portfolio.length > 0 ? (
              // Dynamic portfolio items
              portfolio.filter(item => item.isActive).slice(0, 6).map((item, index) => {
                const technologies = JSON.parse(item.technologies || '[]');
                return (
                  <div key={item.id} className="group relative overflow-hidden rounded-xl bg-card border border-border/50 hover:border-primary/50 transition-all duration-300 hover:shadow-xl hover-lift">
                    <div className="aspect-video overflow-hidden">
                      <img
                        src={item.imageUrl}
                        alt={item.title}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        onError={(e) => {
                          e.currentTarget.src = "https://images.unsplash.com/photo-1551434678-e076c223a692?w=600&h=400&fit=crop";
                        }}
                      />
                    </div>
                    <div className="p-6">
                      <div className="flex items-center justify-between mb-3">
                        <Badge variant="secondary" className="bg-primary/10 text-primary">{item.category}</Badge>
                        <div className="flex space-x-2">
                          {technologies.slice(0, 2).map((tech: string, techIndex: number) => (
                            <Badge key={techIndex} variant="outline" className="text-xs">{tech}</Badge>
                          ))}
                        </div>
                      </div>
                      <h3 className="text-lg font-semibold text-foreground mb-2">{item.title}</h3>
                      <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
                        {item.description}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">
                          Completado en {new Date(item.completedAt).getFullYear()}
                        </span>
                        {item.demoUrl ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-primary hover:text-primary/80"
                            onClick={() => window.open(item.demoUrl!, '_blank')}
                          >
                            Ver demo →
                          </Button>
                        ) : (
                          <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80">
                            Ver detalles →
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              // Fallback static items
              [
                {
                  image: "https://images.unsplash.com/photo-1563986768609-322da13575f3?w=600&h=400&fit=crop",
                  category: "E-commerce",
                  technologies: ["React", "Node.js"],
                  title: "Tienda Online Premium",
                  description: "Plataforma completa de e-commerce con carrito de compras, pagos integrados y panel administrativo.",
                  year: "2024"
                },
                {
                  image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&h=400&fit=crop",
                  category: "Dashboard",
                  technologies: ["Vue.js", "Python"],
                  title: "Panel de Analytics",
                  description: "Dashboard interactivo con métricas en tiempo real, reportes automatizados y visualizaciones avanzadas.",
                  year: "2024"
                },
                {
                  image: "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=600&h=400&fit=crop",
                  category: "Mobile App",
                  technologies: ["React Native", "Firebase"],
                  title: "App de Delivery",
                  description: "Aplicación móvil completa para delivery con geolocalización, pagos y seguimiento en tiempo real.",
                  year: "2023"
                },
                {
                  image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&h=400&fit=crop",
                  category: "CRM",
                  technologies: ["Angular", "PostgreSQL"],
                  title: "Sistema CRM Empresarial",
                  description: "Plataforma de gestión de clientes con automatización de ventas y seguimiento de leads.",
                  year: "2023"
                },
                {
                  image: "https://images.unsplash.com/photo-1551434678-e076c223a692?w=600&h=400&fit=crop",
                  category: "E-learning",
                  technologies: ["Next.js", "MongoDB"],
                  title: "Plataforma Educativa",
                  description: "Sistema de aprendizaje online con videos, evaluaciones y certificaciones automáticas.",
                  year: "2023"
                },
                {
                  image: "https://images.unsplash.com/photo-1518186285589-2f7649de83e0?w=600&h=400&fit=crop",
                  category: "Cloud",
                  technologies: ["AWS", "Docker"],
                  title: "Infraestructura Cloud",
                  description: "Migración completa a la nube con arquitectura escalable y alta disponibilidad.",
                  year: "2024"
                }
              ].map((item, index) => (
                <div key={index} className="group relative overflow-hidden rounded-xl bg-card border border-border/50 hover:border-primary/50 transition-all duration-300 hover:shadow-xl hover-lift">
                  <div className="aspect-video overflow-hidden">
                    <img
                      src={item.image}
                      alt={item.title}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  </div>
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-3">
                      <Badge variant="secondary" className="bg-primary/10 text-primary">{item.category}</Badge>
                      <div className="flex space-x-2">
                        {item.technologies.map((tech, techIndex) => (
                          <Badge key={techIndex} variant="outline" className="text-xs">{tech}</Badge>
                        ))}
                      </div>
                    </div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">{item.title}</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      {item.description}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Completado en {item.year}</span>
                      <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80">
                        Ver detalles →
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </motion.div>

          <motion.div
            className="text-center mt-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
          >
            <p className="text-muted-foreground mb-6">
              ¿Quieres ver tu proyecto aquí? Contáctanos y hagamos realidad tu idea.
            </p>
            <Button
              onClick={() => scrollToSection('contacto')}
              className="bg-primary text-white hover:bg-primary/90 font-semibold"
            >
              Comenzar mi Proyecto
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="precios" className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-muted/20 via-background to-muted/30">
        <div className="max-w-7xl mx-auto">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <Badge className="mb-4 bg-primary/10 text-primary border-primary/20">Planes y Servicios</Badge>
            <h2 className="font-sans text-4xl sm:text-5xl font-bold text-foreground mb-6 tracking-tight">
              Modalidades de Trabajo
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Elige la modalidad que mejor se adapte a tus necesidades y objetivos
            </p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto mt-8">
            {modalitiesLoading ? (
              // Loading skeletons
              Array.from({ length: 2 }).map((_, index) => (
                <div key={index} className="rounded-xl bg-card border border-border/50 overflow-hidden">
                  <div className="p-6 space-y-4">
                    <div className="h-8 bg-muted animate-pulse rounded w-3/4"></div>
                    <div className="h-4 bg-muted animate-pulse rounded w-full"></div>
                    <div className="h-6 bg-muted animate-pulse rounded w-1/2"></div>
                    <div className="space-y-2">
                      {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="h-4 bg-muted animate-pulse rounded"></div>
                      ))}
                    </div>
                    <div className="h-12 bg-muted animate-pulse rounded"></div>
                  </div>
                </div>
              ))
            ) : modalitiesError ? (
              <div className="col-span-full text-center text-red-500">
                Error al cargar las modalidades. Por favor, intente más tarde.
              </div>
            ) : workModalities && workModalities.length > 0 ? (
              // Dynamic modalities from database
              workModalities.map((modality: any, index: number) => {
                const features = Array.isArray(modality.features) ? modality.features : JSON.parse(modality.features || '[]');

                return (
                  <motion.div
                    key={modality.id}
                    initial={{ opacity: 0, y: 40 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: index * 0.1 }}
                    viewport={{ once: true }}
                  >
                    <Card className={`h-full transition-all duration-300 relative overflow-visible ${
                      modality.isPopular 
                        ? 'border-2 border-primary shadow-lg hover:shadow-xl' 
                        : 'border-2 border-border/50 hover:border-primary/50 hover:shadow-lg'
                    }`}>
                      {/* Popular Badge - Posicionado arriba fuera del card */}
                      {modality.isPopular && (
                        <>
                          <div className="absolute -top-5 left-1/2 transform -translate-x-1/2 z-20">
                            <Badge className="bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-500 text-white font-bold px-8 py-2 shadow-lg text-sm whitespace-nowrap rounded-full border-2 border-white">
                              ⭐ {modality.badgeText || 'Más Popular'}
                            </Badge>
                          </div>
                          {/* Background Gradient */}
                          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none"></div>
                        </>
                      )}

                      <CardHeader className="pt-6 pb-6 relative z-10 space-y-3">
                        <div className="space-y-2">
                          <CardTitle className={`text-2xl sm:text-3xl font-bold leading-tight ${
                            modality.isPopular ? 'text-primary' : 'text-foreground'
                          }`}>
                            {modality.title}
                          </CardTitle>
                          {modality.subtitle && (
                            <p className="text-sm font-semibold text-muted-foreground">
                              {modality.subtitle}
                            </p>
                          )}
                        </div>
                        <p className="text-muted-foreground leading-relaxed text-sm sm:text-base pt-2">
                          {modality.description}
                        </p>
                      </CardHeader>
                      
                      <CardContent className="relative z-10 px-6 pb-8">
                        {/* Price Section */}
                        <div className={`mb-6 p-6 rounded-xl ${
                          modality.isPopular
                            ? 'bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20'
                            : 'bg-muted/30 border border-border'
                        }`}>
                          <div className={`text-3xl sm:text-4xl font-bold mb-1 ${
                            modality.isPopular
                              ? 'text-primary'
                              : 'text-primary'
                          }`}>
                            {modality.priceText}
                          </div>
                          {modality.priceSubtitle && (
                            <p className="text-xs sm:text-sm text-muted-foreground font-medium flex items-center gap-2 mt-2">
                              <Calendar className="h-3 w-3 sm:h-4 sm:w-4" />
                              {modality.priceSubtitle}
                            </p>
                          )}
                        </div>

                        {/* Features List */}
                        <ul className="space-y-3 mb-8">
                          {features.map((feature: string, featureIndex: number) => (
                            <li 
                              key={featureIndex} 
                              className="flex items-start gap-3"
                            >
                              <div className={`rounded-full p-1 mt-0.5 flex-shrink-0 ${
                                modality.isPopular 
                                  ? 'bg-primary/20' 
                                  : 'bg-primary/10'
                              }`}>
                                <CheckCircle className={`h-4 w-4 ${modality.isPopular ? 'text-primary' : 'text-primary/80'}`} />
                              </div>
                              <span className="text-foreground/90 leading-relaxed text-sm font-medium flex-1">{feature}</span>
                            </li>
                          ))}
                        </ul>

                        {/* CTA Button */}
                        <Button
                          size="lg"
                          className={`w-full font-semibold shadow-md hover:shadow-lg transition-shadow duration-200 text-base py-6 ${
                            modality.isPopular
                              ? 'bg-primary hover:bg-primary/90 text-white'
                              : 'bg-primary text-white hover:bg-primary/90'
                          }`}
                          onClick={() => scrollToSection('contacto')}
                          data-testid={`button-contact-${modality.title.toLowerCase().replace(/\s+/g, '-')}`}
                        >
                          {modality.buttonText}
                        </Button>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })
            ) : (
              // Fallback to original hardcoded modalities if no data
              <>
                <motion.div
                  initial={{ opacity: 0, x: -40 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6 }}
                  viewport={{ once: true }}
                >
                  <Card className="h-full hover:border-primary/50 transition-all duration-300 hover:shadow-xl">
                    <CardHeader>
                      <div className="flex items-center justify-between mb-4">
                        <CardTitle className="text-2xl">Compra Completa</CardTitle>
                        <Badge variant="secondary">Tradicional</Badge>
                      </div>
                      <p className="text-muted-foreground">
                        Recibe el código fuente completo y propiedad total del proyecto
                      </p>
                    </CardHeader>
                    <CardContent>
                      <div className="mb-6">
                        <div className="text-3xl font-bold text-primary mb-2">
                          $2,500 - $15,000
                          <span className="text-lg font-normal text-muted-foreground ml-2">USD</span>
                        </div>
                        <p className="text-sm text-muted-foreground">Precio según complejidad</p>
                      </div>

                      <ul className="space-y-4 mb-8">
                        {[
                          "Código fuente completo incluido",
                          "Propiedad intelectual total",
                          "Documentación técnica completa",
                          "3 meses de soporte incluido",
                          "Capacitación del equipo",
                          "Deployment en tu servidor"
                        ].map((feature, index) => (
                          <li key={index} className="flex items-start">
                            <CheckCircle className="h-5 w-5 text-primary mt-0.5 mr-3 flex-shrink-0" />
                            <span className="text-foreground">{feature}</span>
                          </li>
                        ))}
                      </ul>

                      <Button
                        className="w-full bg-primary text-white hover:bg-primary/90 font-semibold shadow-md"
                        onClick={() => scrollToSection('contacto')}
                        data-testid="button-contact-complete"
                      >
                        Solicitar Cotización
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: 40 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6 }}
                  viewport={{ once: true }}
                >
                  <Card className="h-full border-2 border-primary hover:border-primary/70 transition-all duration-300 hover:shadow-xl relative">
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <Badge className="bg-primary text-primary-foreground">
                        Más Popular
                      </Badge>
                    </div>

                    <CardHeader className="pt-8">
                      <div className="flex items-center justify-between mb-4">
                        <CardTitle className="text-2xl">Partnership</CardTitle>
                        <Badge variant="outline" className="border-primary text-primary">Innovador</Badge>
                      </div>
                      <p className="text-muted-foreground">
                        Paga menos, conviértete en partner y genera ingresos revendendolo
                      </p>
                    </CardHeader>
                    <CardContent>
                      <div className="mb-6">
                        <div className="text-3xl font-bold text-primary mb-2">
                          40% - 60%
                          <span className="text-lg font-normal text-muted-foreground ml-2">Descuento</span>
                        </div>
                        <p className="text-sm text-muted-foreground">+ comisiones por ventas</p>
                      </div>

                      <ul className="space-y-4 mb-8">
                        {[
                          "Precio reducido inicial",
                          "Código de referido único",
                          "20-40% comisión por venta",
                          "Dashboard de ganancias",
                          "Sistema de licencias",
                          "Soporte y marketing incluido"
                        ].map((feature, index) => (
                          <li key={index} className="flex items-start">
                            <Star className="h-5 w-5 text-primary mt-0.5 mr-3 flex-shrink-0" />
                            <span className="text-foreground">{feature}</span>
                          </li>
                        ))}
                      </ul>

                      <Button
                        className="w-full bg-primary text-white hover:bg-primary/90 font-semibold shadow-md"
                        onClick={() => scrollToSection('contacto')}
                        data-testid="button-contact-partner"
                      >
                        Convertirse en Partner
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              </>
            )}
          </div>

          {/* Additional Info */}
          <motion.div
            className="mt-16 text-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            viewport={{ once: true }}
          >
            <Card className="inline-block border-2 border-primary/20 bg-gradient-to-r from-primary/5 to-blue-50/30 shadow-lg max-w-3xl mx-auto">
              <CardContent className="p-8">
                <div className="flex items-start gap-4 text-left">
                  <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <CheckCircle className="h-6 w-6 text-primary" />
                  </div>
                  <div className="space-y-3">
                    <p className="text-base text-foreground font-semibold">
                      💡 Emitimos factura electrónica oficial (SET Paraguay) para todos los servicios
                    </p>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Incluye garantía de 6 meses, actualizaciones de seguridad y soporte técnico prioritario.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contacto" className="py-16 px-4 sm:px-6 lg:px-8 bg-background">
        <div className="max-w-7xl mx-auto">
          <motion.div
            className="text-center mb-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="font-sans text-3xl sm:text-4xl font-bold text-foreground mb-4 tracking-tight">
              ¿Listo para comenzar?
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Completa nuestro formulario profesional y recibe una propuesta personalizada en menos de 24 horas
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
          >
            <ContactForm />
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <Footer />

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        mode={authMode}
        onModeChange={setAuthMode}
      />

    </Layout>
  );
}