    tailwind.config = {
      theme: {
        extend: {
          colors: {
            paper: "rgb(var(--color-paper) / <alpha-value>)",
            surface: "rgb(var(--color-surface) / <alpha-value>)",
            surfaceSoft: "rgb(var(--color-surface-soft) / <alpha-value>)",
            ink: "rgb(var(--color-ink) / <alpha-value>)",
            muted: "rgb(var(--color-muted) / <alpha-value>)",
            sage: "rgb(var(--color-sage) / <alpha-value>)",
            clay: "rgb(var(--color-clay) / <alpha-value>)",
            borderSoft: "rgb(var(--color-border) / <alpha-value>)"
          },
          boxShadow: {
            card: "var(--shadow-card)"
          }
        }
      }
    };
