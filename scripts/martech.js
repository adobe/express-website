function handleConsentSettings() {
    try {
    if(!window.adobePrivacy || window.adobePrivacy.hasUserProvidedCustomConsent()) {
        window.sprk_full_consent = false;
        return;
    }
    if(window.adobePrivacy.hasUserProvidedConsent()) {
        window.sprk_full_consent = true;
    } else {
        window.sprk_full_consent = false;
    }
    } catch(e) {
    console.warn("Couldn't determine user consent status:", e);
    window.sprk_full_consent = false;
    }
}
window.addEventListener("adobePrivacy:PrivacyConsent", handleConsentSettings);
window.addEventListener("adobePrivacy:PrivacyReject", handleConsentSettings);
window.addEventListener("adobePrivacy:PrivacyCustom", handleConsentSettings);
window.fedsConfig = window.fedsConfig || {};
window.fedsConfig.privacy = window.fedsConfig.privacy || {};
window.fedsConfig.privacy.otDomainId = '7a5eb705-95ed-4cc4-a11d-0cc5760e93db';
window.fedsConfig.privacy.footerLinkSelector = '#openCookieModal';
window.marketingtech = {
    adobe: {
        launch: {
            property: 'global',
            environment: 'prod'
        },
        analytics: {
            additionalAccounts: 'adbemmarvelweb.prod'
        }
    }
};

loadScript('https://www.adobe.com/marketingtech/main.min.js');
loadScript('https://www.adobe.com/etc/beagle/public/globalnav/adobe-privacy/latest/privacy.min.js');