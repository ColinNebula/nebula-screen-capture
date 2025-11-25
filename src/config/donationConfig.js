/**
 * Donation and Support Configuration
 * Configure your donation platforms here
 */

export const donationConfig = {
  // GitHub Sponsors
  github: {
    enabled: true,
    username: 'ColinNebula', // Your GitHub username
    url: 'https://github.com/sponsors/ColinNebula',
    tier: {
      basic: 5,
      supporter: 10,
      patron: 25
    }
  },

  // Ko-fi
  kofi: {
    enabled: true,
    username: 'colin nebula', // Add your Ko-fi username
    url: 'https://ko-fi.com/colinnebula',
    oneTimeAmounts: [3, 5, 10, 25]
  },

  // PayPal
  paypal: {
    enabled: true,
    email: 'colinnebula@hotmail.com', // Add your PayPal email
    url: 'https://paypal.me/colinnebula',
    currency: 'CAD'
  },

  // General settings
  showInApp: true,
  reminderFrequency: 14, // Days between reminders (0 to disable)
  minimumUsageBeforePrompt: 5, // Number of app uses before showing donation prompt
  
  // Messages
  messages: {
    title: '❤️ Support Nebula Screen Capture',
    subtitle: 'Help us keep improving and covering server costs',
    thankYou: 'Thank you for your support! 🙏',
    benefits: [
      '🚀 Help us add new features',
      '💻 Cover server and development costs',
      '🐛 Enable faster bug fixes',
      '📱 Support multi-platform development',
      '🎨 Fund UI/UX improvements'
    ]
  }
};

// Check if user has donated (tracked in localStorage)
export function hasDonated() {
  try {
    return localStorage.getItem('hasSupported') === 'true';
  } catch {
    return false;
  }
}

// Mark user as supporter
export function markAsSupporter() {
  try {
    localStorage.setItem('hasSupported', 'true');
    localStorage.setItem('supportedDate', new Date().toISOString());
    return true;
  } catch {
    return false;
  }
}

// Check if should show donation prompt
export function shouldShowDonationPrompt() {
  if (!donationConfig.showInApp) return false;
  if (hasDonated()) return false;

  try {
    const usageCount = parseInt(localStorage.getItem('appUsageCount') || '0');
    const lastPrompt = localStorage.getItem('lastDonationPrompt');
    
    // Check minimum usage
    if (usageCount < donationConfig.minimumUsageBeforePrompt) {
      return false;
    }

    // Check frequency
    if (lastPrompt && donationConfig.reminderFrequency > 0) {
      const daysSinceLastPrompt = Math.floor(
        (Date.now() - new Date(lastPrompt).getTime()) / (1000 * 60 * 60 * 24)
      );
      return daysSinceLastPrompt >= donationConfig.reminderFrequency;
    }

    return true;
  } catch {
    return false;
  }
}

// Track that prompt was shown
export function trackDonationPrompt() {
  try {
    localStorage.setItem('lastDonationPrompt', new Date().toISOString());
  } catch {}
}

// Increment app usage
export function incrementUsage() {
  try {
    const current = parseInt(localStorage.getItem('appUsageCount') || '0');
    localStorage.setItem('appUsageCount', (current + 1).toString());
  } catch {}
}

// Dismiss donation prompt permanently
export function dismissDonationPrompt() {
  try {
    localStorage.setItem('donationPromptDismissed', 'true');
    localStorage.setItem('dismissedDate', new Date().toISOString());
  } catch {}
}

export default donationConfig;
