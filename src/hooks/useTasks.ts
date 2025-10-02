import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'

export interface Task {
  id: string
  title: string
  priority: 'low' | 'medium' | 'high'
  status: 'pending' | 'in-progress' | 'done'
  user_id: string
  created_at: string
  updated_at: string
  embedding?: number[]
}

export function useTasks() {
  const { user } = useAuth()
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (user) {
      fetchTasks()
    }
  }, [user])

  const fetchTasks = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setTasks(data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const generateEmbedding = async (title: string) => {
    try {
      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-embedding`;
      
      const headers = {
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      };

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify({ text: title })
      });

      if (!response.ok) {
        throw new Error('Failed to generate embedding');
      }

      const data = await response.json();
      return data.embedding;
    } catch (err) {
      console.error('Error generating embedding:', err);
      return null;
    }
  };
  const addTask = async (title: string, priority: 'low' | 'medium' | 'high' = 'medium') => {
    try {
      // Generate embedding for the task title
      const embedding = await generateEmbedding(title);
      
      const { data, error } = await supabase
        .from('tasks')
        .insert([
          {
            title,
            priority,
            status: 'pending',
            user_id: user?.id,
            embedding: embedding
          }
        ])
        .select()
        .single()

      if (error) throw error
      setTasks(prev => [data, ...prev])
      return { data, error: null }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add task'
      setError(errorMessage)
      return { data: null, error: errorMessage }
    }
  }

  const updateTask = async (id: string, updates: Partial<Pick<Task, 'title' | 'priority' | 'status'>>) => {
    try {
      // If title is being updated, generate new embedding
      let finalUpdates = { ...updates, updated_at: new Date().toISOString() };
      if (updates.title) {
        const embedding = await generateEmbedding(updates.title);
        if (embedding) {
          finalUpdates.embedding = embedding;
        }
      }
      
      const { data, error } = await supabase
        .from('tasks')
        .update(finalUpdates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      setTasks(prev => prev.map(task => task.id === id ? data : task))
      return { data, error: null }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update task'
      setError(errorMessage)
      return { data: null, error: errorMessage }
    }
  }

  const deleteTask = async (id: string) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', id)

      if (error) throw error
      setTasks(prev => prev.filter(task => task.id !== id))
      return { error: null }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete task'
      setError(errorMessage)
      return { error: errorMessage }
    }
  }

  return {
    tasks,
    loading,
    error,
    addTask,
    updateTask,
    deleteTask,
    refetch: fetchTasks
  }
}