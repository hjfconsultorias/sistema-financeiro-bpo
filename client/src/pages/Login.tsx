import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "../contexts/AuthContext";
import { trpc } from "../lib/trpc";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Eye, EyeOff, RefreshCw, Volume2 } from "lucide-react";
import { toast } from "sonner";

export default function Login() {
  const [, setLocation] = useLocation();
  const { login: authLogin, isAuthenticated } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [captchaCode, setCaptchaCode] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [captchaSvg, setCaptchaSvg] = useState("");
  const [captchaSessionId, setCaptchaSessionId] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const generateCaptchaMutation = trpc.auth.generateCaptcha.useMutation();
  const loginMutation = trpc.auth.customLogin.useMutation();

  // Gera CAPTCHA ao carregar a página
  useEffect(() => {
    loadCaptcha();
  }, []);

  const loadCaptcha = async () => {
    try {
      const result = await generateCaptchaMutation.mutateAsync();
      setCaptchaSvg(result.svg);
      setCaptchaSessionId(result.sessionId);
      setCaptchaCode(""); // Limpa campo ao gerar novo CAPTCHA
    } catch (error) {
      toast.error("Erro ao carregar CAPTCHA");
      console.error(error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password || !captchaCode) {
      toast.error("Preencha todos os campos");
      return;
    }

    setIsLoading(true);

    try {
      const result = await loginMutation.mutateAsync({
        email,
        password,
        captchaCode,
        captchaSessionId,
      });

      if (result.success) {
        // Usa o AuthContext para fazer login
        authLogin(result.token, result.user);
        
        toast.success(`Bem-vindo, ${result.user.name}!`);
        setLocation("/modules");
      }
    } catch (error: any) {
      toast.error(error.message || "Erro ao fazer login");
      // Gera novo CAPTCHA após erro
      loadCaptcha();
    } finally {
      setIsLoading(false);
    }
  };

  const speakCaptcha = () => {
    // Função para "ler" o CAPTCHA em voz alta (acessibilidade)
    // Por enquanto, apenas mostra toast
    toast.info("Recurso de áudio em desenvolvimento");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-4">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="space-y-4 text-center">
          {/* Logo do Sistema */}
          <div className="flex justify-center mb-4">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center shadow-lg">
              <span className="text-4xl font-bold text-white">EK</span>
            </div>
          </div>
          
          <div>
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
              BPO EK
            </CardTitle>
            <CardDescription className="text-base mt-2">
              Business Process Outsourcing
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Campo de Email */}
            <div className="space-y-2">
              <Label htmlFor="email">Digite seu login de rede</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu.email@exemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                className="h-12 text-base"
                autoComplete="email"
              />
            </div>

            {/* Campo de Senha */}
            <div className="space-y-2">
              <Label htmlFor="password">Digite sua senha</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  className="h-12 text-base pr-12"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {/* CAPTCHA Visual */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Código de verificação</Label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={loadCaptcha}
                    disabled={isLoading || generateCaptchaMutation.isPending}
                    className="text-blue-600 hover:text-blue-700 transition-colors disabled:opacity-50"
                    title="Gerar novo código"
                  >
                    <RefreshCw size={18} className={generateCaptchaMutation.isPending ? "animate-spin" : ""} />
                  </button>
                  <button
                    type="button"
                    onClick={speakCaptcha}
                    disabled={isLoading}
                    className="text-blue-600 hover:text-blue-700 transition-colors disabled:opacity-50"
                    title="Ouvir código"
                  >
                    <Volume2 size={18} />
                  </button>
                </div>
              </div>
              
              {/* Imagem do CAPTCHA */}
              <div 
                className="w-full h-16 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center overflow-hidden shadow-md"
                dangerouslySetInnerHTML={{ __html: captchaSvg }}
              />
            </div>

            {/* Campo para digitar CAPTCHA */}
            <div className="space-y-2">
              <Label htmlFor="captcha">Digite o código acima</Label>
              <Input
                id="captcha"
                type="text"
                placeholder="Digite o código"
                value={captchaCode}
                onChange={(e) => setCaptchaCode(e.target.value.toUpperCase())}
                disabled={isLoading}
                className="h-12 text-base uppercase tracking-wider"
                maxLength={6}
                autoComplete="off"
              />
            </div>

            {/* Botão de Login */}
            <Button
              type="submit"
              disabled={isLoading || !email || !password || !captchaCode}
              className="w-full h-12 text-base font-semibold bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 shadow-lg"
            >
              {isLoading ? "Entrando..." : "Entrar"}
            </Button>
          </form>

          {/* Versão do Sistema */}
          <div className="mt-8 text-center text-sm text-muted-foreground">
            v1.0.0
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
