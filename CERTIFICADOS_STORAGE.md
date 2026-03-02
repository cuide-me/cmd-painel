# Certificados no Firebase Storage

## Estrutura de Dados

### Firestore (Coleção `users`)

Cada documento de usuário pode ter os seguintes campos relacionados à verificação:

```typescript
{
  id: string;
  nome: string;
  email: string;
  perfil: 'profissional' | 'cliente';
  
  // Status de verificação
  statusVerificacao?: 'verificado' | 'pendente' | 'reprovado';
  
  // Paths dos certificados no Firebase Storage
  documentosCertificados?: string[];
  // Exemplo: ['certificados/user123/diploma.pdf', 'certificados/user123/coren.jpg']
}
```

## Firebase Storage - Estrutura de Pastas

```
gs://{project-id}.appspot.com/
└── certificados/
    ├── {userId}/
    │   ├── diploma.pdf
    │   ├── coren.jpg
    │   ├── certificado_curso.pdf
    │   └── cpf.jpg
    └── {userId2}/
        └── ...
```

## Como Funciona

### 1. Upload de Certificado (App)
Quando um profissional faz upload de certificado:

```javascript
// No app cliente (React Native / Web)
const storage = getStorage();
const storageRef = ref(storage, `certificados/${userId}/${filename}`);
await uploadBytes(storageRef, file);

// Salvar o path no Firestore
await updateDoc(doc(db, 'users', userId), {
  documentosCertificados: arrayUnion(`certificados/${userId}/${filename}`)
});
```

### 2. Listagem no Admin Panel

O serviço `listUsers` automaticamente:
1. Busca o campo `documentosCertificados` do Firestore
2. Para cada path, gera uma **Signed URL** válida por 7 dias usando Firebase Admin SDK
3. Retorna as URLs prontas para uso na interface

```typescript
// src/services/admin/users/listUsers.ts
async function getCertificateDownloadUrls(paths: string[]): Promise<string[]> {
  const storage = getStorage(getFirebaseAdmin());
  const bucket = storage.bucket();
  
  const urls = await Promise.all(
    paths.map(async (path) => {
      const file = bucket.file(path);
      const [url] = await file.getSignedUrl({
        action: 'read',
        expires: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 dias
      });
      return url;
    })
  );
  
  return urls;
}
```

### 3. Exibição na Interface

Na página de usuários ([users/page.tsx](src/app/admin/users/page.tsx)):

```tsx
const formatCertificados = (docs?: string[]) => {
  if (!docs || docs.length === 0) return '-';
  return (
    <div className="flex flex-col gap-1">
      {docs.map((doc, idx) => (
        <a
          key={idx}
          href={doc} // URL assinada do Storage
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:text-blue-800 underline"
        >
          📄 Cert {idx + 1}
        </a>
      ))}
    </div>
  );
};
```

## Workflow de Verificação

### Pendente → Verificado/Reprovado

1. Profissional faz upload dos documentos via app
2. Status fica como `pendente` ou `undefined`
3. Admin acessa a [página de usuários](https://cmd-painel-main.vercel.app/admin/users)
4. Admin clica nos links de certificados para visualizar
5. Admin altera o status para:
   - ✅ **Verificado**: Documentos aprovados
   - ❌ **Reprovado**: Documentos rejeitados
   - 🟡 **Pendente**: Aguardando análise

## Variáveis de Ambiente

O Firebase Storage usa as mesmas credenciais do Firebase Admin:

```env
# Vercel
FIREBASE_ADMIN_SERVICE_ACCOUNT=<base64_json>

# Ou separado:
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n..."
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project-id.iam.gserviceaccount.com

# Bucket (padrão: {project-id}.appspot.com)
# FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
```

## Segurança

### Signed URLs
- URLs são temporárias (7 dias de validade)
- Não expõem credenciais
- Podem ser compartilhadas com segurança

### Regras do Storage
Exemplo de regras no Firebase Console:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Apenas profissionais podem fazer upload dos próprios certificados
    match /certificados/{userId}/{filename} {
      allow read: if request.auth != null && request.auth.uid == userId;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Admin pode ler tudo via Admin SDK (server-side)
  }
}
```

## Exemplo de Uso Completo

### 1. Usuário faz upload (App)
```typescript
// components/UploadCertificate.tsx
async function handleUpload(file: File) {
  const userId = auth.currentUser.uid;
  const filename = `${Date.now()}_${file.name}`;
  const path = `certificados/${userId}/${filename}`;
  
  // Upload para Storage
  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, file);
  
  // Salvar path no Firestore
  await updateDoc(doc(db, 'users', userId), {
    documentosCertificados: arrayUnion(path),
    statusVerificacao: 'pendente'
  });
}
```

### 2. Admin visualiza (Panel)
1. Admin acessa `/admin/users`
2. Vê coluna "Certificados" com links clicáveis
3. Clica para abrir documento em nova aba
4. Avalia e atualiza status de verificação

## Troubleshooting

### URLs não carregando
- Verificar se `FIREBASE_ADMIN_SERVICE_ACCOUNT` está configurado
- Conferir se os paths no Firestore estão corretos
- Verificar permissões do Service Account

### Uploads falhando (App)
- Verificar regras do Storage
- Conferir autenticação do usuário
- Validar tamanho máximo do arquivo

### Logs úteis
```javascript
// Ver logs no servidor
console.log('[Storage] Gerando URL para:', path);
console.log('[Storage] Bucket:', bucket.name);
```
