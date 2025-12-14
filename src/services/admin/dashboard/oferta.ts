import { getFirestore } from 'firebase-admin/firestore';
import { getFirebaseAdmin } from '@/lib/server/firebaseAdmin';

/**
 * Serviço: Indicadores do Lado da Oferta (Profissionais)
 */

export async function getProfissionaisDisponiveisHoje() {
  getFirebaseAdmin();
  const db = getFirestore();

  const profissionaisSnap = await db
    .collection('users')
    .where('perfil', '==', 'profissional')
    .where('status', '==', 'ativo')
    .get();

  return profissionaisSnap.size;
}

export async function getProfissionaisPerfilCompleto() {
  getFirebaseAdmin();
  const db = getFirestore();

  const profissionaisSnap = await db
    .collection('users')
    .where('perfil', '==', 'profissional')
    .get();

  const perfisCompletos = profissionaisSnap.docs.filter(doc => {
    const data = doc.data();

    // Critérios para perfil 100%
    const temNome = !!data.nome || !!data.displayName;
    const temFoto = !!data.photoURL || !!data.profileImage;
    const temBio = !!data.bio || !!data.descricao;
    const temEspecialidades = (data.especialidades || []).length > 0;
    const temExperiencia = !!data.experiencia || !!data.anosExperiencia;
    const temCertificacoes = (data.certificacoes || data.formacoes || []).length > 0;

    const camposPreenchidos = [
      temNome,
      temFoto,
      temBio,
      temEspecialidades,
      temExperiencia,
      temCertificacoes,
    ].filter(Boolean).length;

    // Perfil 100% = todos os 6 campos preenchidos
    return camposPreenchidos === 6;
  });

  return perfisCompletos.length;
}

export async function getProfissionaisRespostaRapida() {
  getFirebaseAdmin();
  const db = getFirestore();

  const seteDiasAtras = new Date();
  seteDiasAtras.setDate(seteDiasAtras.getDate() - 7);

  // Buscar mensagens/respostas dos últimos 7 dias
  const messagesSnap = await db
    .collection('messages')
    .where('senderType', '==', 'profissional')
    .where('createdAt', '>=', seteDiasAtras)
    .get();

  const respostasPorProfissional = new Map<string, number[]>();

  messagesSnap.docs.forEach(doc => {
    const data = doc.data();
    const profissionalId = data.senderId;
    const requestId = data.requestId;

    // Calcular tempo de resposta (simplificado)
    const createdAt = data.createdAt?.toDate() || new Date();
    const requestCreatedAt = data.requestCreatedAt?.toDate() || new Date();
    const tempoResposta = (createdAt.getTime() - requestCreatedAt.getTime()) / (1000 * 60 * 60); // em horas

    if (!respostasPorProfissional.has(profissionalId)) {
      respostasPorProfissional.set(profissionalId, []);
    }
    respostasPorProfissional.get(profissionalId)!.push(tempoResposta);
  });

  let profissionaisRapidos = 0;
  respostasPorProfissional.forEach(tempos => {
    const mediaHoras = tempos.reduce((a, b) => a + b, 0) / tempos.length;
    if (mediaHoras < 2) {
      profissionaisRapidos++;
    }
  });

  return profissionaisRapidos;
}
