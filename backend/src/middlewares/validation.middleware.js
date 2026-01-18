const validators = {
  username: (value) => {
    if (!value || typeof value !== 'string') return false;
    if (value.length < 1 || value.length > 50) return false;
    return /^[a-zA-Z0-9_-]+$/.test(value);
  },
  
  email: (value) => {
    if (!value || typeof value !== 'string') return false;
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  },
  
  platform: (value) => {
    const validPlatforms = ['leetcode', 'codeforces', 'codechef', 'github', 'atcoder'];
    return validPlatforms.includes(value?.toLowerCase());
  }
};

export const validate = (rules) => {
  return (req, res, next) => {
    const errors = [];
    
    for (const [field, rule] of Object.entries(rules)) {
      const value = req.params[field] || req.body[field] || req.query[field];
      
      if (rule.required && !value) {
        errors.push(`${field} is required`);
        continue;
      }
      
      if (value && rule.type && !validators[rule.type](value)) {
        errors.push(`${field} is invalid`);
      }
    }
    
    if (errors.length > 0) {
      return res.status(400).json({ error: 'Validation failed', details: errors });
    }
    
    next();
  };
};

export const sanitize = (req, res, next) => {
  const sanitizeString = (str) => {
    if (typeof str !== 'string') return str;
    return str.trim().replace(/[<>\"'&]/g, '');
  };
  
  // Sanitize params
  for (const key in req.params) {
    req.params[key] = sanitizeString(req.params[key]);
  }
  
  // Sanitize body
  if (req.body && typeof req.body === 'object') {
    for (const key in req.body) {
      if (typeof req.body[key] === 'string') {
        req.body[key] = sanitizeString(req.body[key]);
      }
    }
  }
  
  next();
};