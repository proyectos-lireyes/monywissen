import fs from 'fs';

let content = fs.readFileSync('src/context/AppContext.tsx', 'utf8');

const search = `            if (prevStr === payloadStr) return prev;
            
            return {
              ...payload,
              authToken: prev.authToken,
              authUser: prev.authUser
            };`;

const replace = `            if (prevStr === payloadStr) return prev;
            
            if (payload.lastUpdatedAt && prev.lastUpdatedAt && payload.lastUpdatedAt < prev.lastUpdatedAt) {
                console.log('Ignorando payload antiguo del servidor');
                return prev;
            }
            
            return {
              ...payload,
              authToken: prev.authToken,
              authUser: prev.authUser,
              lastUpdatedAt: payload.lastUpdatedAt || prev.lastUpdatedAt
            };`;

content = content.replace(search, replace);
fs.writeFileSync('src/context/AppContext.tsx', content);
