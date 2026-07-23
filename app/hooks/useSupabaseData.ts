import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '../utils/supabase/client';
import { Schedule, TaskLog, UserProfile, LeaderboardEntry } from '../types';

export function useSupabaseData() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  // Fetch Current Profile
// Fetch Current Profile
const useProfile = (userId: string | undefined) => {
  return useQuery({
    queryKey: ['profile', userId],
    queryFn: async () => {
      if (!userId) return null;
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle(); // 🌟 Changed from .single() to avoid 406 errors

      if (error) throw error;
      
      // If no profile exists yet, return null so your UI can handle it (e.g., prompt onboarding)
      if (!data) return null;

      // Map snake_case to camelCase
      return {
        email: data.email,
        name: data.name,
        streak: data.streak,
        lastActiveDate: data.last_active_date,
        notificationsEnabled: data.notifications_enabled,
        darkModeEnabled: data.dark_mode_enabled,
      } as UserProfile;
    },
    enabled: !!userId,
  });
};


  // Fetch Schedules
  const useSchedules = (userId: string | undefined) => {
    return useQuery({
      queryKey: ['schedules', userId],
      queryFn: async () => {
        if (!userId) return [];
        const { data, error } = await supabase
          .from('schedules')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false });

        if (error) throw error;
        
        return data.map(d => ({
          id: d.id,
          title: d.title,
          description: d.description,
          category: d.category,
          recurrence: d.recurrence,
          weeklyDays: d.weekly_days,
          monthlyDay: d.monthly_day,
          durationMinutes: d.duration_minutes,
          startDate: d.start_date,
          endDate: d.end_date,
          createdAt: d.created_at,
        })) as Schedule[];
      },
      enabled: !!userId,
    });
  };

  // Fetch Task Logs
  const useTaskLogs = (userId: string | undefined) => {
    return useQuery({
      queryKey: ['task_logs', userId],
      queryFn: async () => {
        if (!userId) return [];
        const { data, error } = await supabase
          .from('task_logs')
          .select('*')
          .eq('user_id', userId);

        if (error) throw error;
        
        return data.map(d => ({
          id: d.id,
          scheduleId: d.schedule_id,
          date: d.date,
          completed: d.completed,
          durationRequired: d.duration_required,
          durationLogged: d.duration_logged,
          rolledOver: d.rolled_over,
          rolledOverToNextDay: d.rolled_over_to_next_day,
        })) as TaskLog[];
      },
      enabled: !!userId,
    });
  };

  // Create Schedule Mutation
  const useCreateSchedule = () => {
    return useMutation({
      mutationFn: async ({ userId, schedule }: { userId: string, schedule: Omit<Schedule, 'id' | 'createdAt'> }) => {
        const { data, error } = await supabase
          .from('schedules')
          .insert([{
            user_id: userId,
            title: schedule.title,
            description: schedule.description,
            category: schedule.category,
            recurrence: schedule.recurrence,
            weekly_days: schedule.weeklyDays,
            monthly_day: schedule.monthlyDay,
            duration_minutes: schedule.durationMinutes,
            start_date: schedule.startDate,
            end_date: schedule.endDate
          }])
          .select()
          .single();
        if (error) throw error;
        return data;
      },
      onSuccess: (_, variables) => {
        queryClient.invalidateQueries({ queryKey: ['schedules', variables.userId] });
      }
    });
  };

  // Delete Schedule Mutation
  const useDeleteSchedule = () => {
    return useMutation({
      mutationFn: async ({ id, userId }: { id: string, userId: string }) => {
        const { error } = await supabase
          .from('schedules')
          .delete()
          .eq('id', id)
          .eq('user_id', userId);
        if (error) throw error;
      },
      onSuccess: (_, variables) => {
        queryClient.invalidateQueries({ queryKey: ['schedules', variables.userId] });
      }
    });
  };

  // Update Schedule Mutation
  const useUpdateSchedule = () => {
    return useMutation({
      mutationFn: async ({ userId, id, schedule }: { userId: string, id: string, schedule: Partial<Omit<Schedule, 'id' | 'createdAt'>> }) => {
        const { data, error } = await supabase
          .from('schedules')
          .update({
            title: schedule.title,
            description: schedule.description,
            category: schedule.category,
            recurrence: schedule.recurrence,
            weekly_days: schedule.weeklyDays,
            monthly_day: schedule.monthlyDay,
            duration_minutes: schedule.durationMinutes,
            start_date: schedule.startDate,
            end_date: schedule.endDate
          })
          .eq('id', id)
          .eq('user_id', userId)
          .select()
          .single();
        if (error) throw error;
        return data;
      },
      onSuccess: (_, variables) => {
        queryClient.invalidateQueries({ queryKey: ['schedules', variables.userId] });
      }
    });
  };

  // Log Task Effort Mutation
  const useUpdateTaskLog = () => {
    return useMutation({
      mutationFn: async ({ 
        userId, 
        logId, 
        scheduleId, 
        date, 
        completed, 
        durationLogged, 
        durationRequired 
      }: {
        userId: string,
        logId: string,
        scheduleId: string,
        date: string,
        completed: boolean,
        durationLogged: number,
        durationRequired: number
      }) => {
        const { data, error } = await supabase
          .from('task_logs')
          .upsert({
            id: logId,
            user_id: userId,
            schedule_id: scheduleId,
            date: date,
            completed: completed,
            duration_logged: durationLogged,
            duration_required: durationRequired
          }, { onConflict: 'id' })
          .select();
        if (error) throw error;
        return data;
      },
      onSuccess: (_, variables) => {
        queryClient.invalidateQueries({ queryKey: ['task_logs', variables.userId] });
      }
    });
  };

  // Leaderboard
  const useLeaderboard = () => {
    return useQuery({
      queryKey: ['leaderboard'],
      queryFn: async () => {
        const { data, error } = await supabase
          .from('profiles')
          .select('name, streak')
          .order('streak', { ascending: false })
          .limit(10);
          
        if (error) throw error;
        
        return data.map((d, i) => ({
          rank: i + 1,
          name: d.name || 'Anonymous',
          streak: d.streak || 0,
          avatar: "🧑‍💻",
          achievement: d.streak > 5 ? "Consistent" : "Newbie"
        })) as LeaderboardEntry[];
      }
    });
  };

  return {
    useProfile,
    useSchedules,
    useTaskLogs,
    useCreateSchedule,
    useUpdateSchedule,
    useDeleteSchedule,
    useUpdateTaskLog,
    useLeaderboard,
  };
}
