import { supabase } from './supabase';
import { Pool, Participant, PoolGroup } from '../types';

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
  client: supabase,

  auth: {
    login: async (email, password) => {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      return data;
    },
    signUp: async (email, password, metadata = {}) => {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: metadata
            }
        });
        if (error) throw error;
        return data;
    },
    logout: async () => {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
    },
    getProfile: async (userId: string) => {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();
        if (error) return null;
        return data;
    }
  },

  pools: {
    async getList(): Promise<Pool[]> {
      const localPools = getLocal(POOLS_KEY);
      try {
        const { data, error } = await supabase
          .from('pools')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (error) throw error;
        if (!data) return localPools;

        const remoteIds = new Set(data.map(r => r.id));
        const uniqueLocal = localPools.filter((p: Pool) => !remoteIds.has(p.id));
        return [...data, ...uniqueLocal];
      } catch (e) { 
        console.warn('Usando dados locais para pools devido a erro:', e);
        return localPools; 
      }
    },
    async create(data: Partial<Pool>): Promise<Pool> {
      try { 
        const { data: created, error } = await supabase
            .from('pools')
            .insert(data)
            .select()
            .single();
        if (error) throw error;
        return created;
      }
      catch (e) { 
        console.warn('Salvando pool localmente:', e);
        return saveLocal(POOLS_KEY, { ...data, id: `pool_${Date.now()}` }); 
      }
    },
    async update(id: string, data: Partial<Pool>) {
      try { 
        const { data: updated, error } = await supabase
            .from('pools')
            .update(data)
            .eq('id', id)
            .select()
            .single();
        if (error) throw error;
        return updated;
      }
      catch (e) { updateLocal(POOLS_KEY, id, data); }
    },
    async subscribe(callback: (payload: any) => void) {
      return supabase
        .channel('pools_changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'pools' }, callback)
        .subscribe();
    }
  },

  groups: {
    async getList(): Promise<PoolGroup[]> {
      const localGroups = getLocal(GROUPS_KEY);
      try {
        const { data, error } = await supabase
            .from('groups')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        if (!data) return localGroups;

        const remoteIds = new Set(data.map(r => r.id));
        const uniqueLocal = localGroups.filter((g: PoolGroup) => !remoteIds.has(g.id));
        return [...data, ...uniqueLocal];
      } catch (e) { return localGroups; }
    },
    async getOne(id: string): Promise<PoolGroup | null> {
      try { 
        const { data, error } = await supabase
            .from('groups')
            .select('*')
            .eq('id', id)
            .single();
        if (error) throw error;
        return data;
      }
      catch (e) { 
        const normalizedId = id.startsWith('group_') ? id : `group_${id}`;
        return getLocal(GROUPS_KEY).find((g: any) => g.id === normalizedId || g.id === id) || null;
      }
    },
    async create(data: Partial<PoolGroup>): Promise<PoolGroup> {
      try { 
        const { data: created, error } = await supabase
            .from('groups')
            .insert(data)
            .select()
            .single();
        if (error) throw error;
        return created;
      }
      catch (e) { return saveLocal(GROUPS_KEY, { ...data, id: `group_${Date.now()}`, balance: 0, participants: [] }); }
    },
    async update(id: string, data: Partial<PoolGroup>) {
      try { 
        const { data: updated, error } = await supabase
            .from('groups')
            .update(data)
            .eq('id', id)
            .select()
            .single();
        if (error) throw error;
        return updated;
      }
      catch (e) { updateLocal(GROUPS_KEY, id, data); }
    },
    async addParticipant(groupId: string, participantId: string, luckyNumber?: number) {
      // Note: This logic might need adjustment depending on how relational data is handled in Supabase
      // Assuming 'participants' is a JSONB column in 'groups' table for now, mirroring the current structure
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
        const { data, error } = await supabase
            .from('participants')
            .select('*')
            .order('name');
        
        if (error) throw error;
        if (!data) return localParticipants;

        const remoteIds = new Set(data.map(r => r.id));
        const uniqueLocal = localParticipants.filter((p: Participant) => !remoteIds.has(p.id));
        return [...data, ...uniqueLocal];
      } catch (e) { return localParticipants; }
    },
    // Add create/update methods as needed
  }
};
