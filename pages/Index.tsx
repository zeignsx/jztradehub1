import { lazy, Suspense, useEffect, useState, useRef } from "react";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Zap, 
  ArrowRight, 
  Shield, 
  Truck, 
  Headphones, 
  TrendingUp, 
  Star, 
  Users, 
  Clock, 
  CheckCircle,
  Sparkles,
  Award,
  Wallet,
  Globe,
  Smartphone,
  ShoppingBag,
  Mail,
  ChevronRight,
  Crown,
  Gem,
  Target,
  Eye,
  Layers,
  BarChart3,
  RefreshCw,
  CreditCard,
  UserCheck,
  DollarSign,
  Rocket,
  Heart,
  ThumbsUp,
  Play,
  Circle,
  Square
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import { useInView } from "react-intersection-observer";

// Lazy load components
const FloatingShapes = lazy(() => import("@/components/FloatingShapes"));
const HowItWorks = lazy(() => import("@/components/HowItWorks"));
const Features = lazy(() => import("@/components/Features"));
const TrustBadges = lazy(() => import("@/components/TrustBadges"));
const CTA = lazy(() => import("@/components/CTA"));
const Footer = lazy(() => import("@/components/Footer"));
const SiteAlert = lazy(() => import("@/components/SiteAlert"));
const AdCarousel = lazy(() => import("@/components/AdCarousel"));
const FlashSales = lazy(() => import("@/components/FlashSales"));
const SmartSearch = lazy(() => import("@/components/SmartSearch"));
const PopupAd = lazy(() => import("@/components/PopupAd"));

const SectionLoader = () => (
  <div className="py-8 flex items-center justify-center">
    <div className="animate-pulse bg-muted rounded-lg h-32 w-full max-w-4xl" />
  </div>
);

// Fancy Animated Counter
const FancyCounter = ({ target, suffix = "", prefix = "" }: { target: number; suffix?: string; prefix?: string }) => {
  const [count, setCount] = useState(0);
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.1 });

  useEffect(() => {
    if (inView) {
      let start = 0;
      const duration = 2500;
      const increment = target / (duration / 16);
      const timer = setInterval(() => {
        start += increment;
        if (start >= target) {
          setCount(target);
          clearInterval(timer);
        } else {
          setCount(Math.floor(start));
        }
      }, 16);
      return () => clearInterval(timer);
    }
  }, [inView, target]);

  return (
    <span ref={ref} className="text-5xl md:text-6xl font-black bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent">
      {prefix}{count.toLocaleString()}{suffix}
    </span>
  );
};

// Fancy Feature Card
const FancyFeatureCard = ({ icon: Icon, title, description, delay, gradient }: any) => {
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.1 });
  
  const gradients = {
    primary: "from-primary/30 to-primary/5",
    secondary: "from-secondary/30 to-secondary/5",
    accent: "from-accent/30 to-accent/5",
    rainbow: "from-primary/30 via-accent/30 to-secondary/30"
  };

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 50 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay, type: "spring", bounce: 0.3 }}
      whileHover={{ y: -10, transition: { duration: 0.2 } }}
      className="group"
    >
      <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-background/80 to-background/40 backdrop-blur-sm shadow-xl hover:shadow-2xl transition-all duration-500">
        <div className={`absolute inset-0 bg-gradient-to-br ${gradients[gradient] || gradients.primary} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-primary/20 to-transparent rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        <CardContent className="p-8 relative z-10">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg shadow-primary/30">
            <Icon className="w-8 h-8 text-white" />
          </div>
          <h3 className="text-2xl font-bold mb-3 group-hover:text-primary transition-colors">{title}</h3>
          <p className="text-muted-foreground leading-relaxed">{description}</p>
          <div className="mt-4 flex items-center gap-2 text-primary opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <span className="text-sm font-medium">Learn more</span>
            <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

// Fancy Testimonial Card
const FancyTestimonialCard = ({ name, role, content, rating, avatar, delay }: any) => {
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.1 });
  
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={inView ? { opacity: 1, scale: 1 } : {}}
      transition={{ duration: 0.5, delay, type: "spring" }}
      whileHover={{ y: -5, scale: 1.02 }}
      className="relative"
    >
      <div className="absolute -top-4 -left-4 w-20 h-20 bg-gradient-to-br from-primary/20 to-accent/20 rounded-full blur-2xl" />
      <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-background/80 to-background/40 backdrop-blur-sm shadow-xl">
        <CardContent className="p-8">
          <div className="flex gap-1 mb-4">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className={`w-5 h-5 ${i < rating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"}`} />
            ))}
          </div>
          <p className="text-muted-foreground mb-6 leading-relaxed text-lg">"{content}"</p>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold text-lg shadow-lg">
              {avatar || name.charAt(0)}
            </div>
            <div>
              <p className="font-bold text-lg">{name}</p>
              <p className="text-sm text-muted-foreground">{role}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

// Fancy Category Card with Navigation
const FancyCategoryCard = ({ name, icon: Icon, color, count, delay, category }: any) => {
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.1 });
  const navigate = useNavigate();
  
  const handleClick = () => {
    // Navigate to marketplace with category filter
    navigate(`/marketplace?category=${encodeURIComponent(name)}`);
  };
  
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={inView ? { opacity: 1, scale: 1 } : {}}
      transition={{ duration: 0.4, delay, type: "spring" }}
      whileHover={{ scale: 1.05, y: -5 }}
      onClick={handleClick}
      className="group cursor-pointer"
    >
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-br from-primary to-accent rounded-2xl blur-xl opacity-0 group-hover:opacity-30 transition-opacity duration-500" />
        <div className="relative glass-strong rounded-2xl p-6 text-center border border-white/10 group-hover:border-primary/30 transition-all duration-300">
          <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br from-${color}/20 to-${color}/10 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300`}>
            <Icon className={`w-10 h-10 text-${color}`} />
          </div>
          <h4 className="font-bold text-lg mb-1">{name}</h4>
          <p className="text-sm text-muted-foreground">{count}+ items</p>
        </div>
      </div>
    </motion.div>
  );
};

// Fancy Stat Card
const FancyStatCard = ({ icon: Icon, value, label, delay, suffix = "", prefix = "" }: any) => {
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.1 });
  
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={inView ? { opacity: 1, scale: 1 } : {}}
      transition={{ duration: 0.5, delay, type: "spring" }}
      whileHover={{ scale: 1.05 }}
      className="relative"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-accent/20 rounded-2xl blur-2xl opacity-0 hover:opacity-100 transition-opacity duration-500" />
      <div className="relative glass-strong rounded-2xl p-6 text-center border border-white/10 hover:border-primary/30 transition-all duration-300">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center mx-auto mb-4">
          <Icon className="w-8 h-8 text-primary" />
        </div>
        <div className="text-4xl md:text-5xl font-black text-primary mb-2">
          {prefix}{inView ? value : "0"}{suffix}
        </div>
        <div className="text-sm text-muted-foreground font-medium">{label}</div>
      </div>
    </motion.div>
  );
};

// Marquee Partner Logo
const PartnerMarquee = () => {
  const partners = [
    "Nairatrader", "Nairatrader", "Nairatrader", "Brand 4", "Brand 5", "Brand 6",
    "Brand 7", "Brand 8", "Brand 9", "Brand 10", "Brand 11", "Brand 12"
  ];

  return (
    <div className="relative overflow-hidden py-8">
      <div className="absolute inset-0 bg-gradient-to-r from-background via-transparent to-background z-10" />
      <motion.div
        animate={{ x: [0, -1920] }}
        transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
        className="flex gap-12 whitespace-nowrap"
      >
        {[...partners, ...partners].map((partner, i) => (
          <div key={i} className="glass-strong rounded-xl px-8 py-4 mx-2">
            <span className="text-lg font-semibold text-muted-foreground">{partner}</span>
          </div>
        ))}
      </motion.div>
    </div>
  );
};

// Animated Background Shapes
const AnimatedBackground = () => {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 50, repeat: Infinity, ease: "linear" }}
        className="absolute top-20 left-10 w-96 h-96 bg-primary/5 rounded-full blur-3xl"
      />
      <motion.div
        animate={{ rotate: -360 }}
        transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
        className="absolute bottom-20 right-10 w-96 h-96 bg-accent/5 rounded-full blur-3xl"
      />
      <motion.div
        animate={{ y: [0, -50, 0] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-1/3 left-1/4 w-64 h-64 bg-secondary/5 rounded-full blur-3xl"
      />
      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/3 via-transparent to-transparent" />
      <div className="absolute bottom-0 right-0 w-full h-full bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-accent/3 via-transparent to-transparent" />
    </div>
  );
};

// Smooth Scroll Button
const ScrollToTop = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const toggleVisibility = () => {
      setVisible(window.scrollY > 500);
    };
    window.addEventListener("scroll", toggleVisibility);
    return () => window.removeEventListener("scroll", toggleVisibility);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.button
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0 }}
          whileHover={{ scale: 1.1 }}
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 z-50 p-4 rounded-full bg-gradient-to-r from-primary to-accent text-white shadow-2xl hover:shadow-3xl transition-all duration-300"
        >
          <ArrowRight className="w-5 h-5 rotate-[-90deg]" />
        </motion.button>
      )}
    </AnimatePresence>
  );
};

const Index = () => {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const { scrollYProgress } = useScroll();
  const heroOpacity = useTransform(scrollYProgress, [0, 0.3], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 0.3], [1, 0.95]);

  useEffect(() => {
    window.addEventListener("scroll", () => setScrolled(window.scrollY > 50));
    return () => window.removeEventListener("scroll", () => setScrolled(window.scrollY > 50));
  }, []);

  const categories = [
    { name: "Electronics", icon: Smartphone, color: "primary", count: 120, delay: 0 },
    { name: "Fashion", icon: ShoppingBag, color: "secondary", count: 250, delay: 0.05 },
    { name: "Home & Living", icon: Shield, color: "accent", count: 80, delay: 0.1 },
    { name: "Health & Beauty", icon: Sparkles, color: "primary", count: 95, delay: 0.15 },
    { name: "Sports", icon: TrendingUp, color: "secondary", count: 60, delay: 0.2 },
    { name: "Books", icon: Globe, color: "accent", count: 45, delay: 0.25 },
  ];

  const features = [
    { icon: Shield, title: "Escrow Protection", description: "Your payment is held securely until you confirm delivery. 100% safe transactions.", gradient: "primary", delay: 0 },
    { icon: Truck, title: "Fast Delivery", description: "Get your items delivered within 2-5 business days nationwide with real-time tracking.", gradient: "secondary", delay: 0.1 },
    { icon: Headphones, title: "24/7 Support", description: "Our support team is always ready to help you anytime, anywhere via chat or phone.", gradient: "accent", delay: 0.2 },
    { icon: Award, title: "Verified Sellers", description: "All sellers are thoroughly vetted and verified before joining our platform.", gradient: "primary", delay: 0.3 },
    { icon: Wallet, title: "Easy Payouts", description: "Fast and secure payouts directly to your bank account with multiple withdrawal options.", gradient: "secondary", delay: 0.4 },
    { icon: TrendingUp, title: "Low Commission", description: "Only 5% commission per transaction. More profit for sellers, better value for buyers.", gradient: "accent", delay: 0.5 },
  ];

  const testimonials = [
    { name: "Adaobi Nwosu", role: "Verified Buyer", content: "Excellent platform! The escrow protection gives me peace of mind when shopping. Delivery was fast and the seller was very responsive.", rating: 5, avatar: "A", delay: 0 },
    { name: "Emeka Okafor", role: "Top Seller", content: "JZTradeHub has transformed my business. The platform is easy to use and customer support is amazing. I've made over ₦500k in sales!", rating: 5, avatar: "E", delay: 0.1 },
    { name: "Chioma Eze", role: "Regular Shopper", content: "I love shopping here! The products are authentic and prices are competitive. The dispute resolution process is very fair.", rating: 5, avatar: "C", delay: 0.2 },
  ];

  return (
    <div className="relative min-h-screen bg-background overflow-x-hidden">
      {/* Smooth Scroll Behavior */}
      <style jsx global>{`
        html {
          scroll-behavior: smooth;
        }
      `}</style>

      <AnimatedBackground />

      <Suspense fallback={null}>
        <FloatingShapes />
        <SiteAlert />
      </Suspense>
      
      {/* Sticky Header */}
      <motion.div 
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${scrolled ? "bg-background/95 backdrop-blur-2xl shadow-2xl" : ""}`}
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5, type: "spring" }}
      >
        <Header />
      </motion.div>
      
      {/* Hero Section with Parallax */}
      <motion.div style={{ opacity: heroOpacity, scale: heroScale }}>
        <Hero />
      </motion.div>
      
      {/* Premium Bill Payment Banner */}
      <div className="container px-4 py-8 -mt-8 relative z-20">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3, type: "spring" }}
          className="max-w-6xl mx-auto"
        >
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary/10 via-accent/10 to-secondary/10 p-6 border border-primary/20 backdrop-blur-sm group">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/30 via-transparent to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
            <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-5">
                <motion.div 
                  className="p-4 rounded-2xl bg-gradient-to-br from-primary to-accent shadow-xl shadow-primary/30"
                  animate={{ scale: [1, 1.05, 1], rotate: [0, 5, -5, 0] }}
                  transition={{ duration: 3, repeat: Infinity }}
                >
                  <Zap className="w-7 h-7 text-white" />
                </motion.div>
                <div>
                  <h3 className="font-bold text-xl">Pay Bills Instantly</h3>
                  <p className="text-muted-foreground">
                    Electricity, Cable TV, Airtime & more - All in one place
                  </p>
                </div>
              </div>
              <Button 
                onClick={() => navigate("/profile?tab=bills")}
                className="bg-gradient-to-r from-primary to-accent hover:shadow-2xl hover:shadow-primary/40 transition-all duration-300 group px-8 py-6 text-lg"
                size="lg"
              >
                <span>Pay Bills Now</span>
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
      
      {/* Smart Search */}
      <div className="container px-4 py-8 relative z-20">
        <Suspense fallback={<SectionLoader />}>
          <SmartSearch />
        </Suspense>
      </div>
      
      {/* Premium Stats Section */}
      <section className="py-24 relative z-20">
        <div className="container px-4">
          <div className="max-w-6xl mx-auto">
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center mb-16"
            >
              <Badge variant="secondary" className="mb-4 px-5 py-1.5 text-sm rounded-full">Our Impact</Badge>
              <h2 className="text-5xl md:text-6xl font-bold mb-5">
                Trusted by <span className="bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent">Thousands</span>
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
                Join thousands of satisfied customers who have found success on our platform
              </p>
            </motion.div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <FancyStatCard icon={Users} value="50" label="Happy Customers" suffix="K+" delay={0} />
              <FancyStatCard icon={ShoppingBag} value="10" label="Orders Completed" suffix="K+" delay={0.1} />
              <FancyStatCard icon={Star} value="4.9" label="Customer Rating" delay={0.2} />
              <FancyStatCard icon={Clock} value="24/7" label="Support Available" delay={0.3} />
            </div>
          </div>
        </div>
      </section>
      
      {/* Premium Categories Section - CLICKABLE */}
      <section className="py-24 relative z-20 bg-muted/30">
        <div className="container px-4">
          <div className="max-w-6xl mx-auto">
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center mb-16"
            >
              <Badge variant="secondary" className="mb-4 px-5 py-1.5 text-sm rounded-full">Shop by Category</Badge>
              <h2 className="text-5xl md:text-6xl font-bold mb-5">
                Browse Our <span className="bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent">Categories</span>
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
                Find exactly what you're looking for with our wide range of categories
              </p>
            </motion.div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-5">
              {categories.map((category, index) => (
                <FancyCategoryCard key={index} {...category} />
              ))}
            </div>
          </div>
        </div>
      </section>
      
      {/* Flash Sales */}
      <Suspense fallback={<SectionLoader />}>
        <FlashSales />
      </Suspense>
      
      {/* Premium Features Section */}
      <section className="py-24 relative z-20">
        <div className="container px-4">
          <div className="max-w-6xl mx-auto">
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center mb-16"
            >
              <Badge variant="secondary" className="mb-4 px-5 py-1.5 text-sm rounded-full">Why Choose Us</Badge>
              <h2 className="text-5xl md:text-6xl font-bold mb-5">
                Amazing <span className="bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent">Features</span>
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
                We provide the best marketplace experience with features designed for your safety and convenience
              </p>
            </motion.div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-7">
              {features.map((feature, index) => (
                <FancyFeatureCard key={index} {...feature} />
              ))}
            </div>
          </div>
        </div>
      </section>
      
      {/* Premium Testimonials Section */}
      <section className="py-24 relative z-20 bg-muted/30">
        <div className="container px-4">
          <div className="max-w-6xl mx-auto">
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center mb-16"
            >
              <Badge variant="secondary" className="mb-4 px-5 py-1.5 text-sm rounded-full">Testimonials</Badge>
              <h2 className="text-5xl md:text-6xl font-bold mb-5">
                What <span className="bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent">Customers Say</span>
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
                Don't just take our word for it - hear from our satisfied customers
              </p>
            </motion.div>
            <div className="grid md:grid-cols-3 gap-7">
              {testimonials.map((testimonial, index) => (
                <FancyTestimonialCard key={index} {...testimonial} />
              ))}
            </div>
          </div>
        </div>
      </section>
      
      {/* Partners Marquee */}
      <section className="py-16 relative z-20">
        <div className="container px-4">
          <div className="text-center mb-10">
            <h3 className="text-2xl font-bold mb-2">Trusted by <span className="text-primary">Leading Brands</span></h3>
            <p className="text-muted-foreground">Join thousands of businesses that trust our platform</p>
          </div>
          <PartnerMarquee />
        </div>
      </section>
      
      <Suspense fallback={<SectionLoader />}>
        <TrustBadges />
        <HowItWorks />
        <CTA />
      </Suspense>
      
      {/* Premium Download App Banner */}
      <section className="py-24 relative z-20">
        <div className="container px-4">
          <div className="max-w-6xl mx-auto">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, type: "spring" }}
              className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-primary via-accent to-secondary p-12 text-center text-white shadow-2xl"
            >
              <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22%3E%3Cpath fill=%22%23ffffff%22 fill-opacity=%220.05%22 d=%22M10 10 L90 10 L50 50 Z%22/%3E%3C/svg%3E')] opacity-10" />
              <motion.div 
                className="relative z-10"
                initial={{ y: 20 }}
                whileInView={{ y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <motion.div 
                  className="inline-flex p-4 rounded-full bg-white/20 mb-6"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                >
                  <Smartphone className="w-10 h-10" />
                </motion.div>
                <h2 className="text-4xl md:text-5xl font-bold mb-4">Download Our Mobile App</h2>
                <p className="text-white/80 mb-8 max-w-md mx-auto text-lg">
                  Get the best shopping experience on your phone. Shop anytime, anywhere.
                </p>
                <div className="flex flex-col sm:flex-row gap-5 justify-center">
                  <Button variant="secondary" size="lg" className="bg-white text-primary hover:bg-white/90 group px-8 py-6 text-lg rounded-xl">
                    <svg className="w-6 h-6 mr-2" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.18.07 2.29.46 3.08.91.79-.45 1.9-.84 3.08-.91 1.54-.03 2.79.44 3.58 1.32-2.14 1.27-2.07 4.41.16 5.74-.68 1.53-1.56 3.05-2.86 3.91z"/>
                    </svg>
                    App Store
                  </Button>
                  <Button variant="secondary" size="lg" className="bg-white text-primary hover:bg-white/90 group px-8 py-6 text-lg rounded-xl">
                    <svg className="w-6 h-6 mr-2" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M3.609 1.814L13.792 12 3.61 22.186a.996.996 0 0 1-.61-.92V2.734a1 1 0 0 1 .609-.92z"/>
                    </svg>
                    Google Play
                  </Button>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>
      
      {/* Premium Newsletter Section */}
      <section className="py-24 relative z-20 bg-muted/30">
        <div className="container px-4">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <motion.div 
                className="inline-flex p-4 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 mb-6"
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Mail className="w-8 h-8 text-primary" />
              </motion.div>
              <h2 className="text-4xl md:text-5xl font-bold mb-4">Subscribe to Our Newsletter</h2>
              <p className="text-muted-foreground mb-8 text-lg max-w-md mx-auto">
                Get the latest updates on new products, exclusive offers, and shopping tips
              </p>
              <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
                <input 
                  type="email" 
                  placeholder="Enter your email address" 
                  className="flex-1 px-6 py-4 rounded-xl glass-strong border border-white/10 focus:border-primary focus:outline-none transition-all text-lg"
                />
                <Button className="bg-gradient-to-r from-primary to-accent whitespace-nowrap px-8 py-6 text-lg rounded-xl shadow-lg shadow-primary/30 hover:shadow-xl transition-all">
                  Subscribe
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </div>
            </motion.div>
          </div>
        </div>
      </section>
      
      <Suspense fallback={<SectionLoader />}>
        <AdCarousel />
        <Footer />
      </Suspense>
      
      {/* Popup Ad */}
      <PopupAd />
      
      {/* Smooth Scroll to Top Button */}
      <ScrollToTop />
    </div>
  );
};

export default Index;