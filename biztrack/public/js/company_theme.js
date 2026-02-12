// assets/bizui/js/company_theme.js
$(document).ready(function () {
    function getDefaultCompany() {
        // Try boot info first
        if (frappe.boot && frappe.boot.user && frappe.boot.user.defaults) {
            return frappe.boot.user.defaults.company || frappe.boot.user.defaults.Company;
        }
        // Fallback: frappe.defaults API
        if (frappe.defaults && frappe.defaults.get_user_default) {
            return frappe.defaults.get_user_default('Company');
        }
        return null;
    }

    function setNavbarColor(company) {
        const gradients = {
            "Biztechnosys": "linear-gradient(135deg, #1a1a1a 50%, #ff9900 50%)",
            "CRM Doctor": "linear-gradient(125deg, #0a0a0aff 50%, #2FED89 50%)",
            "BIZ Infra": "linear-gradient(105deg, #1a1a1a 50%, #F9C51E 50%)"
        };

        const gradient = gradients[company];
        if (gradient) {
            const nav = document.querySelector('.navbar');
            if (nav) {
                nav.style.setProperty('background', gradient, 'important');
                nav.style.padding = "0.8rem 1.5rem";
                nav.style.boxShadow = "0 4px 10px rgba(0, 0, 0, 0.25)";
                nav.style.borderBottom = "1px solid rgba(255,255,255,0.1)";
                nav.style.transition = "all 0.3s ease-in-out";
            }
            console.log("[bizui.theme] Applied gradient", gradient, "for", company);
        } else {
            console.warn("[bizui.theme] No gradient mapping found for", company);
        }
    }

    function setNavbarLogo(company) {
        const logos = {
            "Biztechnosys": "/files/new_bizlogo.png",
            "CRM Doctor": "/files/crm-doctor-logo.png",
            "BIZ Infra": "/files/biz_infra_logo.png",
            "Al Ghaith Building Construction LLC (Demo)": "/files/alghaith_imagek.png"
        };

        const logoSrc = logos[company];
        if (logoSrc) {
            const logoElement = document.querySelector('.navbar .navbar-brand img');
            if (logoElement) {
                logoElement.src = logoSrc;
                logoElement.style.height = "40px"; // adjust size if needed
                logoElement.style.objectFit = "contain";
                console.log("[bizui.theme] Applied logo", logoSrc, "for", company);
            } else {
                console.warn("[bizui.theme] Navbar logo element not found");
            }
        } else {
            console.warn("[bizui.theme] No logo mapping found for", company);
        }
    }

    function applyTheme() {
        const company = getDefaultCompany();
        if (company) {
            setNavbarColor(company.trim());
            setNavbarLogo(company.trim());
        } else {
            console.warn("[bizui.theme] Could not detect default company");
        }
    }

    // Apply theme initially
    applyTheme();

    // Watch for company change dynamically (Session Defaults change without refresh)
    frappe.realtime.on("session_defaults_updated", function () {
        setTimeout(applyTheme, 300); // small delay to ensure defaults updated
    });
});
