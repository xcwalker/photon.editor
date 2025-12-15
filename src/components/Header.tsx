import { useEffect, useState } from "react";
import css from "../styles/components/header.module.css";
import toast from "react-hot-toast";
import Dropdown from "./Dropdown";

export default function Header() {
  const [theme, setTheme] = useState<"system" | "light" | "dark">("system");

  // Apply theme to html[data-theme]
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    toast.success(`Theme set to ${theme}`);
  }, [theme]);

  return (
    <header className={css.header}>
      <div className={css.titleContainer}>
        <h1 className={css.title}>Photon Editor</h1>
        <p className={css.subtitle}>EMV Script Editor for Photon</p>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <Dropdown 
          options={[
            { value: "system", label: "System" },
            { value: "light", label: "Light" },
            { value: "dark", label: "Dark" },
          ]}
          value={theme}
          onChange={(value) => setTheme(value as "system" | "light" | "dark")}
        />
      </div>
    </header>
  );
}
