import React from "react";
import ncbabanklogo from "../../../assets/ncbabanklogo.png";
import heroIllustration from "../../../assets/auth-checklist-hero.svg";
import "../../../styles/authPages.css";

const AuthSplitLayout = ({
  title,
  subtitle,
  status,
  social,
  dividerText,
  children,
  footer,
}) => {
  return (
    <div className="auth-shell">
      <section className="auth-shell__form-panel">
        <div className="auth-shell__form-wrap">
          <div className="auth-shell__brand">
            <img src={ncbabanklogo} alt="NCBA Bank" className="auth-shell__brand-logo" />
          </div>

          <div className="auth-shell__heading">
            <h1 className="auth-shell__title">{title}</h1>
            {subtitle ? <p className="auth-shell__subtitle">{subtitle}</p> : null}
          </div>

          {status ? <div className="auth-shell__status">{status}</div> : null}

          {social ? <div className="auth-shell__social">{social}</div> : null}

          {dividerText ? (
            <div className="auth-shell__divider">
              <span>{dividerText}</span>
            </div>
          ) : null}

          <div className="auth-shell__body">{children}</div>

          {footer ? <div className="auth-shell__footer">{footer}</div> : null}
        </div>
      </section>

      <aside className="auth-shell__visual-panel">
        <div className="auth-shell__visual-art">
          <img
            src={heroIllustration}
            alt="Banking checklist and deferral workflow illustration"
            className="auth-shell__illustration"
          />
        </div>
      </aside>
    </div>
  );
};

export default AuthSplitLayout;