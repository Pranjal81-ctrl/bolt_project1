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

  const addTask = async (title: string, priority: 'low' | 'medium' | 'high' = 'medium') => {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .insert([
          {
            title,
            priority,
            status: 'pending',
            user_id: user?.id
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
      const { data, error } = await supabase
        .from('tasks')
        .update({ ...updates, updated_at: new Date().toISOString() })
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