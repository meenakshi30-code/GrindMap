const allowedOrigins = {
  development: [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://localhost:3001'
  ],
  production: [
    'https://grindmap.vercel.app',
    'https://www.grindmap.com'
  ]
};

const corsOptions = {
  origin: (origin, callback) => {
    const env = process.env.NODE_ENV || 'development';
    const allowed = allowedOrigins[env] || allowedOrigins.development;
    
    if (!origin || allowed.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: false,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 86400
};

export { corsOptions };