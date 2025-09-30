import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'

export interface Subtask {
  id: string
  title: string
  parent_task_id: string
  priority: 'low' | 'medium' | 'high'
  status: 'pending' | 'in-progress' | 'done'
  user_id: string
  created_at: string
  updated_at: string
}

export function useSubtasks(parentTaskId?: string) {
  const { user } = useAuth()
  const [subtasks, setSubtasks] = useState<Subtask[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (user && parentTaskId) {
      fetchSubtasks()
    }
  }, [user, parentTaskId])

  const fetchSubtasks = async () => {
    if (!parentTaskId) return
    
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('subtasks')
        .select('*')
        .eq('parent_task_id', parentTaskId)
        .order('created_at', { ascending: false })

      if (error) throw error
      setSubtasks(data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const addSubtask = async (title: string, priority: 'low' | 'medium' | 'high' = 'medium') => {
    if (!parentTaskId) return { data: null, error: 'Parent task ID is required' }
    
    try {
      const { data, error } = await supabase
        .from('subtasks')
        .insert([
          {
            title,
            parent_task_id: parentTaskId,
            priority,
            status: 'pending',
            user_id: user?.id
          }
        ])
        .select()
        .single()

      if (error) throw error
      setSubtasks(prev => [data, ...prev])
      return { data, error: null }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add subtask'
      setError(errorMessage)
      return { data: null, error: errorMessage }
    }
  }

  const updateSubtask = async (id: string, updates: Partial<Pick<Subtask, 'title' | 'priority' | 'status'>>) => {
    try {
      const { data, error } = await supabase
        .from('subtasks')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      setSubtasks(prev => prev.map(subtask => subtask.id === id ? data : subtask))
      return { data, error: null }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update subtask'
      setError(errorMessage)
      return { data: null, error: errorMessage }
    }
  }

  const deleteSubtask = async (id: string) => {
    try {
      const { error } = await supabase
        .from('subtasks')
        .delete()
        .eq('id', id)

      if (error) throw error
      setSubtasks(prev => prev.filter(subtask => subtask.id !== id))
      return { error: null }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete subtask'
      setError(errorMessage)
      return { error: errorMessage }
    }
  }

  const generateSubtasks = async (parentTaskTitle: string) => {
    try {
      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-subtasks`
      
      const headers = {
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      }

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify({ parentTaskTitle })
      })

      if (!response.ok) {
        throw new Error('Failed to generate subtasks')
      }

      const { subtasks } = await response.json()
      return { subtasks, error: null }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate subtasks'
      return { subtasks: [], error: errorMessage }
    }
  }

  return {
    subtasks,
    loading,
    error,
    addSubtask,
    updateSubtask,
    deleteSubtask,
    generateSubtasks,
    refetch: fetchSubtasks
  }
}