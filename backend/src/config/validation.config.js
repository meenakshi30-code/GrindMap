export const validationRules = {
  // Auth validation
  login: {
    email: { required: true, type: 'email' },
    password: { required: true, minLength: 6 }
  },
  
  register: {
    username: { required: true, type: 'username' },
    email: { required: true, type: 'email' },
    password: { required: true, minLength: 6 }
  },
  
  // Scraping validation
  scrapeUser: {
    username: { required: true, type: 'username' },
    platform: { required: true, type: 'platform' }
  },
  
  // User validation
  updateProfile: {
    username: { type: 'username' },
    email: { type: 'email' }
  }
};