import { v4 as uuidv4 } from 'uuid'
import { format, startOfWeek, addDays, isToday, parseISO } from 'date-fns'

export const generateId = (): string => uuidv4()

export const formatDate = (date: Date): string => format(date, 'yyyy-MM-dd')

export const formatTime = (minutes: number): string => {
  const hrs = Math.floor(minutes / 60)
  const mins = minutes % 60
  if (hrs === 0) return `${mins}m`
  if (mins === 0) return `${hrs}h`
  return `${hrs}h ${mins}m`
}

export const formatTimerDisplay = (seconds: number): string => {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

export const getWeekDates = (date: Date = new Date()): Date[] => {
  const start = startOfWeek(date, { weekStartsOn: 1 })
  return Array.from({ length: 7 }, (_, i) => addDays(start, i))
}

export const isDateToday = (dateStr: string): boolean => {
  try {
    return isToday(parseISO(dateStr))
  } catch {
    return false
  }
}

export const getTodayKey = (): string => formatDate(new Date())

export const getRelativeDay = (dateStr: string): string => {
  const today = getTodayKey()
  if (dateStr === today) return 'Today'
  const yesterday = formatDate(addDays(new Date(), -1))
  if (dateStr === yesterday) return 'Yesterday'
  return format(parseISO(dateStr), 'EEE, MMM d')
}
