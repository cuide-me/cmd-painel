import { getFirestore } from 'firebase-admin/firestore';
import { getFirebaseAdmin } from '@/lib/server/firebaseAdmin';

/**
 * Serviço: Indicadores do Lado da Demanda (Famílias)
 */

export async function getFamiliasNovas() {
  getFirebaseAdmin();
  const db = getFirestore();

  const agora = new Date();
  const inicioHoje = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate());
  const inicioSemana = new Date(agora);
  inicioSemana.setDate(agora.getDate() - 7);
  const inicioMes = new Date(agora.getFullYear(), agora.getMonth(), 1);

  const usuariosSnap = await db.collection('users').where('perfil', '!=', 'profissional').get();

  const familias = usuariosSnap.docs.map(doc => ({
    id: doc.id,
    createdAt: doc.data().createdAt?.toDate() || new Date(0),
  }));

  return {
    hoje: familias.filter(f => f.createdAt >= inicioHoje).length,
    semana: familias.filter(f => f.createdAt >= inicioSemana).length,
    mes: familias.filter(f => f.createdAt >= inicioMes).length,
  };
}

export async function getFamiliasEmAtendimento() {
  getFirebaseAdmin();
  const db = getFirestore();

  const requestsSnap = await db
    .collection('requests')
    .where('status', 'in', ['em_andamento', 'em_progresso', 'ativo'])
    .get();

  const substatus = {
    contatoFeito: 0,
    doresEntendidas: 0,
    matchIniciado: 0,
  };

  requestsSnap.docs.forEach(doc => {
    const data = doc.data();
    const sub = data.substatus || data.etapa || '';

    if (sub.includes('contato') || sub.includes('primeira_conversa')) {
      substatus.contatoFeito++;
    } else if (sub.includes('dor') || sub.includes('diagnostico') || sub.includes('entendimento')) {
      substatus.doresEntendidas++;
    } else if (sub.includes('match') || sub.includes('proposta')) {
      substatus.matchIniciado++;
    }
  });

  return {
    total: requestsSnap.size,
    substatus,
  };
}

export async function getFamiliasComProposta() {
  getFirebaseAdmin();
  const db = getFirestore();

  const seteDiasAtras = new Date();
  seteDiasAtras.setDate(seteDiasAtras.getDate() - 7);

  const requestsSnap = await db
    .collection('requests')
    .where('status', '==', 'proposta_enviada')
    .get();

  const propostasRecentes = requestsSnap.docs.filter(doc => {
    const updatedAt = doc.data().updatedAt?.toDate() || new Date(0);
    return updatedAt >= seteDiasAtras;
  });

  return propostasRecentes.length;
}

export async function getFamiliasPagantes() {
  getFirebaseAdmin();
  const db = getFirestore();

  const agora = new Date();
  const inicioMes = new Date(agora.getFullYear(), agora.getMonth(), 1);

  const paymentsSnap = await db
    .collection('payments')
    .where('status', '==', 'succeeded')
    .where('createdAt', '>=', inicioMes)
    .get();

  const clientesUnicos = new Set(
    paymentsSnap.docs.map(doc => doc.data().clientId || doc.data().userId)
  );

  return clientesUnicos.size;
}
