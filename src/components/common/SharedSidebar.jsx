import React from "react";
import "../../styles/creatorDesignSystem.css";
import ncbalogo from "../../assets/ncba-logo.png";

const SharedSidebar = ({
  selectedKey,
  setSelectedKey,
  onMenuItemClick,
  collapsed,
  menuItems,
  title = "NCBA Bank",
}) => {
  const handleClick = (key) => {
    const event = { key };

    if (onMenuItemClick) {
      onMenuItemClick(event);
    } else if (setSelectedKey) {
      setSelectedKey(key);
    }
  };

  return (
    <aside className={`creator-sidebar creator-theme ${collapsed ? "creator-sidebar--hidden" : ""}`}>
      <div className="creator-sidebar__brand" style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "16px 24px" }}>
        <img 
          src={ncbalogo} 
          alt="NCBA Logo" 
          style={{ 
            height: "28px", 
            width: "auto", 
            objectFit: "contain",
            flexShrink: 0
          }} 
        />
      </div>

      <div className="creator-sidebar__menu">
        {menuItems.map((item) => {
          const isActive = item.key === selectedKey;

          return (
            <button
              key={item.key}
              type="button"
              onClick={() => handleClick(item.key)}
              className={`creator-sidebar__item ${isActive ? "creator-sidebar__item--active" : ""}`}
            >
              <span className="creator-sidebar__item-icon">{item.icon}</span>
              <span className="creator-sidebar__item-label">{item.label}</span>
              {isActive && <span className="creator-sidebar__item-dot" />}
            </button>
          );
        })}
      </div>
    </aside>
  );
};

export default SharedSidebar;
