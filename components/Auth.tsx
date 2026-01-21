import React, { useState, useRef } from 'react';
import { User, Lock, ArrowRight, Loader2, Trophy, FileText, CheckCircle2, X, ShieldCheck } from 'lucide-react';
import { User as UserType, UserRole } from '../types';
import { db } from '../services/db';

const TERMS_CONTENT = [
  { title: "1. Natureza do Sistema", content: ["1.1. O LottoPoll Master é totalmente gratuito. Não há cobrança de taxas, mensalidades, comissões ou qualquer valor para uso, cadastro ou participação nos bolões organizados por meio do Sistema.", "1.2. O Sistema atua exclusivamente como ferramenta de apoio à organização de bolões, não realizando apostas, intermediações financeiras, pagamentos, recebimentos ou repasses de valores.", "1.3. Todas as apostas são realizadas fora do Sistema, diretamente pelos participantes ou pelo Administrador do Bolão, conforme acordos privados entre as partes."] },
  { title: "2. Administrador do Bolão (Pool_Admin)", content: ["2.1. Cada bolão possui um Administrador do Bolão (Pool_Admin), responsável por:\n• Organizar os participantes;\n• Registrar informações no Sistema;\n• Realizar as apostas junto à loteria oficial;\n• Prestar contas aos participantes.", "2.2. O LottoPoll Master não se responsabiliza por ações, omissões, acordos verbais ou escritos firmados entre participantes e o Pool_Admin."] },
  { title: "3. Condição Especial em Caso de Premiação", content: ["3.1. A utilização do LottoPoll Master é gratuita; entretanto, ao participar de um bolão gerenciado pelo Sistema, o usuário concorda expressamente que:\nEm caso de premiação vencedora na loteria, 5% (cinco por cento) do valor líquido do prêmio será destinado ao Administrador do Bolão (Pool_Admin).", "3.2. Esse percentual é entendido como remuneração pelo trabalho de organização, gestão e administração do bolão, não configurando taxa de uso do Sistema.", "3.3. A divisão do prêmio, bem como o repasse do percentual ao Pool_Admin, é de responsabilidade exclusiva dos participantes, não havendo qualquer ingerência ou responsabilidade do LottoPoll Master nesse processo."] },
  { title: "4. Responsabilidades e Isenções", content: ["4.1. O LottoPoll Master não garante prêmios, resultados, probabilidades ou ganhos financeiros.", "4.2. O Sistema não se responsabiliza por:\n• Falhas humanas na realização das apostas;\n• Informações incorretas inseridas pelo Pool_Admin;\n• Divergências entre participantes;\n• Não pagamento de valores acordados entre as partes.", "4.3. O uso do Sistema ocorre por conta e risco dos usuários."] },
  { title: "5. Conformidade Legal", content: ["5.1. O LottoPoll Master não explora jogos de azar, apostas ou loterias, atuando apenas como plataforma de organização e registro.", "5.2. O usuário declara estar ciente das leis aplicáveis à sua jurisdição e utilizar o Sistema de forma lícita."] },
  { title: "6. Privacidade e Dados", content: ["6.1. O Sistema coleta apenas dados mínimos necessários para funcionamento do bolão.", "6.2. Nenhuma informação financeira ou bancária é solicitada ou armazenada."] },
  { title: "7. Alterações do Termo", content: ["7.1. Este Termo de Uso poderá ser atualizado a qualquer momento, sendo responsabilidade do usuário revisá-lo periodicamente."] },
  { title: "8. Aceite", content: ["Ao utilizar o LottoPoll Master, o usuário declara estar plenamente de acordo com este Termo de Uso, reconhecendo especialmente:\n• A gratuidade total do Sistema;\n• A inexistência de taxas para uso;\n• A destinação de 5% do prêmio ao Administrador do Bolão (Pool_Admin) em caso de ganho na loteria.", "Se a sorte bater à porta, que ela venha com organização, transparência e jogo limpo. 🍀"] }
];

interface AuthProps {
  onLogin: (user: UserType) => void;
}

const Auth: React.FC<AuthProps> = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Terms State
  const [showTerms, setShowTerms] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [canAccept, setCanAccept] = useState(false);
  const termsContentRef = useRef<HTMLDivElement>(null);

  const handleTermsScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    // Allow a small buffer (e.g. 50px)
    if (scrollHeight - scrollTop - clientHeight < 50) {
      setCanAccept(true);
    }
  };

  const handleAcceptTerms = () => {
    setAcceptedTerms(true);
    setShowTerms(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!isLogin && !acceptedTerms) {
        setError("É necessário ler e aceitar os Termos de Uso para criar uma conta.");
        setLoading(false);
        return;
    }

    try {
      console.log("Iniciando processo de autenticação...");
      let authData;
      
      if (isLogin) {
        console.log("Tentando login com:", email);
        authData = await db.auth.login(email, password);
        console.log("Login bem-sucedido. Dados:", authData);
      } else {
        console.log("Tentando cadastro com:", email);
        authData = await db.auth.signUp(email, password, {
          name: email.split('@')[0],
          role: 'POOL_MEMBER'
        });
        console.log("Cadastro bem-sucedido. Dados:", authData);
        // Supabase pode requerer confirmação de email
        if (authData.user && !authData.session) {
          setError("Cadastro realizado! Verifique seu email para confirmar.");
          setLoading(false);
          return;
        }
      }

      if (authData.user) {
        console.log("Usuário autenticado:", authData.user.id);
        // Buscar perfil completo do usuário
        let role: UserRole = 'POOL_MEMBER';
        try {
            console.log("Buscando perfil do usuário...");
            const profile = await db.auth.getProfile(authData.user.id);
            console.log("Perfil retornado:", profile);
            if (profile && profile.role) {
                role = profile.role as UserRole;
            }
        } catch (profileError) {
            console.error("Erro ao buscar perfil no Auth:", profileError);
            // Mantém POOL_MEMBER como fallback
        }
        
        console.log("Chamando onLogin com role:", role);
        onLogin({
          id: authData.user.id,
          name: authData.user.user_metadata?.name || email.split('@')[0],
          email: authData.user.email!,
          role: role
        });
      } else {
          console.warn("Usuário não retornado após login/signup");
      }
    } catch (e: any) {
      console.error("Erro CRÍTICO no Auth:", e);
      setError(e.message || "Falha na autenticação. Verifique suas credenciais.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 p-4">
      {/* Terms Modal */}
      {showTerms && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <div>
                <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                  <FileText className="text-emerald-500" />
                  Termo de Uso
                </h3>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-1">LottoPoll Master • Jan 2026</p>
              </div>
              <button onClick={() => setShowTerms(false)} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors">
                <X size={24} />
              </button>
            </div>
            
            <div 
              className="flex-1 overflow-y-auto p-6 space-y-6 text-slate-600 text-sm leading-relaxed"
              onScroll={handleTermsScroll}
              ref={termsContentRef}
            >
               <p className="font-medium text-slate-800">
                 Bem-vindo ao LottoPoll Master. Este Termo de Uso estabelece as condições para utilização do sistema. Ao acessar ou utilizar o Sistema, você declara ter lido, compreendido e concordado integralmente com os termos abaixo.
               </p>
               
               {TERMS_CONTENT.map((section, idx) => (
                 <div key={idx} className="space-y-3">
                   <h4 className="font-bold text-slate-800 text-base">{section.title}</h4>
                   <div className="space-y-2 pl-4 border-l-2 border-slate-100">
                     {section.content.map((p, pIdx) => (
                       <p key={pIdx} className="whitespace-pre-line">{p}</p>
                     ))}
                   </div>
                 </div>
               ))}
            </div>
            
            <div className="p-6 border-t border-slate-100 bg-slate-50 rounded-b-3xl flex justify-end gap-3 items-center">
              {!canAccept && (
                <p className="text-xs text-slate-400 mr-auto flex items-center gap-2">
                  <ArrowRight size={14} className="animate-bounce" />
                  Leia até o final para aceitar
                </p>
              )}
              <button 
                onClick={() => setShowTerms(false)}
                className="px-6 py-2.5 text-slate-500 font-bold text-sm hover:text-slate-700 transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={handleAcceptTerms}
                disabled={!canAccept}
                className="px-8 py-2.5 bg-emerald-600 text-white rounded-xl font-bold text-sm hover:bg-emerald-700 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg shadow-emerald-200"
              >
                <CheckCircle2 size={18} />
                Li e Concordo
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-md w-full bg-white rounded-[2.5rem] p-10 shadow-2xl border border-white/10">
        <div className="text-center mb-10">
          <div className="w-20 h-20 bg-emerald-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-emerald-900/20">
            <Trophy className="text-white" size={40} />
          </div>
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight">LottoPool Master</h1>
          <p className="text-slate-400 text-sm mt-2 font-medium italic">
            {isLogin ? 'Bem-vindo de volta!' : 'Crie sua conta e participe!'}
          </p>
        </div>

        {error && (
          <div className={`mb-6 p-4 text-sm font-bold rounded-2xl border animate-in fade-in zoom-in-95 ${
            error.includes('Verifique') 
              ? 'bg-blue-50 text-blue-600 border-blue-100' 
              : 'bg-rose-50 text-rose-600 border-rose-100'
          }`}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">E-mail</label>
            <div className="relative group">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors" size={20} />
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-slate-100 text-slate-900 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all placeholder:text-slate-400 font-medium" 
                placeholder="seu@email.com"
                required
              />
            </div>
          </div>

          {!isLogin && (
            <div className="space-y-2 animate-in slide-in-from-top-2">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">CPF</label>
              <div className="relative group">
                <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors" size={20} />
                <input 
                  type="text" 
                  value={cpf}
                  onChange={(e) => setCpf(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-slate-100 text-slate-900 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all placeholder:text-slate-400 font-medium" 
                  placeholder="000.000.000-00"
                  required
                />
              </div>
            </div>
          )}

          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Senha</label>
            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors" size={20} />
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-slate-100 text-slate-900 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all placeholder:text-slate-400 font-medium" 
                placeholder="••••••••"
                required
                minLength={6}
              />
            </div>
          </div>

          {/* Terms Checkbox */}
          {!isLogin && (
            <div className="flex items-start space-x-3 pt-2">
              <div className="relative flex items-center">
                <input
                  type="checkbox"
                  id="terms"
                  checked={acceptedTerms}
                  onChange={(e) => {
                    if (!acceptedTerms) setShowTerms(true);
                    else setAcceptedTerms(false);
                  }}
                  className="peer h-5 w-5 cursor-pointer appearance-none rounded-md border-2 border-slate-300 transition-all checked:border-emerald-500 checked:bg-emerald-500 hover:border-emerald-400"
                />
                <CheckCircle2 size={14} className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-white opacity-0 peer-checked:opacity-100" />
              </div>
              <label htmlFor="terms" className="text-sm text-slate-500 cursor-pointer select-none">
                Li e concordo com os <button type="button" onClick={() => setShowTerms(true)} className="text-emerald-600 font-bold hover:underline">Termos de Uso</button> e a política de participação.
              </label>
            </div>
          )}

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-emerald-600 text-white py-4 rounded-2xl font-bold flex items-center justify-center space-x-3 hover:bg-emerald-700 active:scale-[0.98] transition-all shadow-xl shadow-emerald-900/20 disabled:opacity-50 mt-4"
          >
            {loading ? <Loader2 className="animate-spin" size={24} /> : (
              <>
                <span>{isLogin ? 'Entrar' : 'Criar Conta'}</span>
                <ArrowRight size={20} />
              </>
            )}
          </button>
        </form>

        <div className="mt-8 text-center">
          <button 
            onClick={() => {
              setIsLogin(!isLogin);
              setError(null);
            }}
            className="text-slate-500 hover:text-emerald-600 text-sm font-semibold transition-colors"
          >
            {isLogin ? 'Não tem uma conta? Cadastre-se' : 'Já tem conta? Faça login'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Auth;
