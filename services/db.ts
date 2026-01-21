
import PocketBase from 'pocketbase';
import { Pool, Participant, PoolGroup } from '../types';

const PB_URL = 'https://lottopool-master.pockethost.io';
const pb = new PocketBase(PB_URL);
const POOLS_KEY = 'lottopool_master_pools_v1';
const GROUPS_KEY = 'lottopool_master_groups_v1';
const PARTICIPANTS_KEY = 'lottopool_master_participants_v1';

const getLocal = (key: string) => {
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : [];
};

const saveLocal = (key: string, item: any) => {
  const current = getLocal(key);
  const updated = [item, ...current];
  localStorage.setItem(key, JSON.stringify(updated));
  return item;
};

const updateLocal = (key: string, id: string, data: any) => {
  const current = getLocal(key);
  const updated = current.map((item: any) => item.id === id ? { ...item, ...data } : item);
  localStorage.setItem(key, JSON.stringify(updated));
};

export const db = {
  client: pb,

  pools: {
    async getList(): Promise<Pool[]> {
      const localPools = getLocal(POOLS_KEY);
      try {
        const records = await pb.collection('pools').getFullList<Pool>({ sort: '-created' });
        const remoteIds = new Set(records.map(r => r.id));
        const uniqueLocal = localPools.filter((p: Pool) => !remoteIds.has(p.id));
        return [...records, ...uniqueLocal];
      } catch (e) { return localPools; }
    },
    async create(data: Partial<Pool>): Promise<Pool> {
      try { return await pb.collection('pools').create<Pool>(data); }
      catch (e) { return saveLocal(POOLS_KEY, { ...data, id: `pool_${Date.now()}` }); }
    },
    async update(id: string, data: Partial<Pool>) {
      try { return await pb.collection('pools').update(id, data); }
      catch (e) { updateLocal(POOLS_KEY, id, data); }
    },
    async subscribe(callback: (data: any) => void) {
      try { return await pb.collection('pools').subscribe('*', callback); } catch (e) {}
    }
  },

  groups: {
    async getList(): Promise<PoolGroup[]> {
      const localGroups = getLocal(GROUPS_KEY);
      try {
        const records = await pb.collection('groups').getFullList<PoolGroup>({ sort: '-created' });
        const remoteIds = new Set(records.map(r => r.id));
        const uniqueLocal = localGroups.filter((g: PoolGroup) => !remoteIds.has(g.id));
        return [...records, ...uniqueLocal];
      } catch (e) { return localGroups; }
    },
    async getOne(id: string): Promise<PoolGroup | null> {
      try { return await pb.collection('groups').getOne<PoolGroup>(id); }
      catch (e) { 
        const normalizedId = id.startsWith('group_') ? id : `group_${id}`;
        return getLocal(GROUPS_KEY).find((g: any) => g.id === normalizedId || g.id === id) || null;
      }
    },
    async create(data: Partial<PoolGroup>): Promise<PoolGroup> {
      try { return await pb.collection('groups').create<PoolGroup>(data); }
      catch (e) { return saveLocal(GROUPS_KEY, { ...data, id: `group_${Date.now()}`, balance: 0, participants: [] }); }
    },
    async update(id: string, data: Partial<PoolGroup>) {
      try { return await pb.collection('groups').update(id, data); }
      catch (e) { updateLocal(GROUPS_KEY, id, data); }
    },
    async addParticipant(groupId: string, participantId: string, luckyNumber?: number) {
      const group = await this.getOne(groupId);
      if (!group) return;
      const participants = [...(group.participants || [])];
      if (!participants.some(p => p.participantId === participantId)) {
        participants.push({ participantId, luckyNumber });
      }
      return await this.update(groupId, { participants });
    }
  },

  participants: {
    async getList(): Promise<Participant[]> {
      const localParticipants = getLocal(PARTICIPANTS_KEY);
      try {
        const records = await pb.collection('participants').getFullList<Participant>({ sort: 'name' });
        const remoteIds = new Set(records.map(r => r.id));
        const uniqueLocal = localParticipants.filter((p: Participant) => !remoteIds.has(p.id));
        return [...records, ...uniqueLocal];
      } catch (e) { return localParticipants; }
    },
    async create(data: Partial<Participant>): Promise<Participant> {
      try { return await pb.collection('participants').create<Participant>(data); }
      catch (e) { return saveLocal(PARTICIPANTS_KEY, { ...data, id: `part_${Date.now()}` }); }
    },
    async update(id: string, data: Partial<Participant>) {
      try { return await pb.collection('participants').update(id, data); }
      catch (e) { updateLocal(PARTICIPANTS_KEY, id, data); }
    }
  },

  auth: {
    async login(email: string, pass: string) { return await pb.collection('users').authWithPassword(email, pass); },
    logout() { pb.authStore.clear(); },
    get user() { return pb.authStore.model; }
  }
};
