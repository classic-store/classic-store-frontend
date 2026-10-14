import { useState, type FormEvent } from "react";
import {
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  Gamepad2,
  LockKeyhole,
  Mail,
  ShieldCheck,
  Sparkles,
  Zap,
} from "lucide-react";
import { api, setAuthSession, setAuthToken, type AuthResponse } from "./services/api";

type LoginPageProps = {
  onLoginSuccess: () => void;
  notice?: string;
};

function getResponseToken(response: AuthResponse): string | undefined {
  return response.accessToken ?? response.access_token ?? response.token;
}

export default function LoginPage({ onLoginSuccess, notice }: LoginPageProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await api.login({ email: email.trim(), password, rememberMe });
      const token = getResponseToken(response);

      if (token) {
        setAuthToken(token, rememberMe);
      } else {
        // Also support backends that authenticate with a secure HttpOnly cookie.
        setAuthSession(rememberMe);
      }

      onLoginSuccess();
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Unable to sign in. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="login-page">
      <div className="login-noise" aria-hidden="true" />
      <div className="login-frame">
        <section className="login-showcase" aria-label="Classic Store Admin">
          <div className="login-brand">
            <div className="brand-mark login-brand-mark">CS</div>
            <div>
              <div className="eyebrow">CLASSIC STORE</div>
              <div className="brand-name">Classic Store Admin</div>
            </div>
          </div>

          <div className="showcase-main">
            <div className="showcase-badge"><span className="pulse-dot" /> OPERATOR ACCESS <span className="badge-divider">/</span> LEVEL 01</div>
            <h1>Every match<br />starts <span>here.</span></h1>
            <p className="showcase-copy">
              Your command center for stock, orders, and everything that keeps the store in play.
            </p>

            <div className="game-visual" aria-hidden="true">
              <div className="visual-orbit orbit-one" />
              <div className="visual-orbit orbit-two" />
              <div className="visual-cross cross-horizontal" />
              <div className="visual-cross cross-vertical" />
              <div className="visual-corner corner-one" />
              <div className="visual-corner corner-two" />
              <div className="visual-ring"><Gamepad2 size={66} strokeWidth={1.1} /></div>
              <div className="visual-spark spark-one"><Sparkles size={16} /></div>
              <div className="visual-spark spark-two"><Zap size={14} /></div>
              <div className="visual-readout readout-left"><span>SYS STATUS</span><strong>ALL SYSTEMS GO</strong></div>
              <div className="visual-readout readout-right"><span>MODE</span><strong>ADMIN / LIVE</strong></div>
              <div className="visual-dot-grid" />
            </div>
          </div>

          <div className="showcase-footer">
            <div className="showcase-feature"><ShieldCheck size={16} /><span><strong>Secure access</strong><small>Protected operator console</small></span></div>
            <div className="showcase-feature"><Zap size={16} /><span><strong>Built for speed</strong><small>Less admin. More action.</small></span></div>
            <div className="showcase-version">CS / 01.0</div>
          </div>
        </section>

        <section className="login-panel" aria-label="Sign in">
          <div className="login-panel-top"><span className="panel-indicator" /> PRIVATE OPERATIONS PORTAL</div>
          <div className="login-heading">
            <div className="login-icon"><LockKeyhole size={21} /></div>
            <div className="eyebrow">WELCOME BACK</div>
            <h2>Sign in to your<br /><span>command center.</span></h2>
            <p>Enter your operator credentials to continue.</p>
          </div>

          {notice && <div className="login-success" role="status">{notice}</div>}
          <form className="login-form" onSubmit={handleSubmit}>
            <label className="login-field">
              <span className="login-label">EMAIL ADDRESS</span>
              <span className="login-input-wrap">
                <Mail size={17} aria-hidden="true" />
                <input autoComplete="username" type="email" name="email" placeholder="operator@classicstore.com"
                  value={email} onChange={(event) => setEmail(event.target.value)} required autoFocus />
              </span>
            </label>
            <label className="login-field">
              <span className="login-label">PASSWORD</span>
              <span className="login-input-wrap">
                <LockKeyhole size={17} aria-hidden="true" />
                <input autoComplete="current-password" type={showPassword ? "text" : "password"} name="password"
                  placeholder="Enter your password" value={password} onChange={(event) => setPassword(event.target.value)} required />
                <button className="password-toggle" type="button" onClick={() => setShowPassword((visible) => !visible)}
                  aria-label={showPassword ? "Hide password" : "Show password"}>
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </span>
            </label>
            <div className="login-options">
              <label className="remember-option">
                <input type="checkbox" checked={rememberMe} onChange={(event) => setRememberMe(event.target.checked)} />
                <span className="custom-checkbox"><CheckCircle2 size={12} /></span> Remember me
              </label>
              <span className="login-session-label">ENCRYPTED SESSION</span>
            </div>
            {error && <div className="login-error" role="alert">{error}</div>}
            <button className="login-submit" type="submit" disabled={loading}>
              <span>{loading ? "AUTHENTICATING..." : "SIGN IN TO DASHBOARD"}</span>
              <span className="login-submit-icon"><ArrowRight size={17} /></span>
            </button>
          </form>

          <div className="login-security-note"><ShieldCheck size={15} /> <span>Secure operator authentication</span><span className="security-line" /></div>
          <div className="login-panel-bottom"><span>NEED ACCESS? CONTACT YOUR STORE ADMIN</span><span>© CLASSIC STORE</span></div>
        </section>
      </div>
    </main>
  );
}
