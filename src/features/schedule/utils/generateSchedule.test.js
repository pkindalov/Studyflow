import { describe, it, expect } from 'vitest'
import { generateSchedule } from './generateSchedule'

const task = (overrides) => ({ id: '1', text: 'Task', done: false, priority: false, ...overrides })

const run = (tasks, opts = {}) =>
  generateSchedule({
    tasksForDay: tasks,
    excludedTaskIds: new Set(),
    totalStudyTime: 1,
    priorityPercent: 40,
    ...opts,
  })

const totalMinutes = (result) => result.reduce((s, t) => s + t.scheduledMinutes, 0)

describe('generateSchedule', () => {
  describe('returns null when nothing to schedule', () => {
    it('no tasks', () => {
      expect(run([])).toBeNull()
    })

    it('totalStudyTime is 0', () => {
      expect(run([task()], { totalStudyTime: 0 })).toBeNull()
    })

    it('totalStudyTime is negative', () => {
      expect(run([task()], { totalStudyTime: -1 })).toBeNull()
    })

    it('all tasks are done', () => {
      expect(run([task({ done: true })])).toBeNull()
    })

    it('all tasks are excluded', () => {
      expect(run([task({ id: 'a' })], { excludedTaskIds: new Set(['a']) })).toBeNull()
    })
  })

  describe('time allocation', () => {
    it('total scheduledMinutes equals totalStudyTime * 60', () => {
      const result = run([task({ id: '1' }), task({ id: '2' }), task({ id: '3' })], { totalStudyTime: 2 })
      expect(totalMinutes(result)).toBe(120)
    })

    it('single task receives all minutes', () => {
      const result = run([task()], { totalStudyTime: 1 })
      expect(result[0].scheduledMinutes).toBe(60)
    })

    it('priority tasks receive priorityPercent of total time', () => {
      const tasks = [task({ id: 'p', priority: true }), task({ id: 'n', priority: false })]
      const result = run(tasks, { totalStudyTime: 1, priorityPercent: 40 })
      expect(result.find((t) => t.priority).scheduledMinutes).toBe(24) // 40% of 60
      expect(result.find((t) => !t.priority).scheduledMinutes).toBe(36) // 60% of 60
    })

    it('all-priority set gets all the time', () => {
      const tasks = [task({ id: '1', priority: true }), task({ id: '2', priority: true })]
      const result = run(tasks, { totalStudyTime: 1, priorityPercent: 40 })
      expect(totalMinutes(result)).toBe(60)
    })

    it('no-priority set gets all the time when priorityPercent > 0', () => {
      const tasks = [task({ id: '1' }), task({ id: '2' })]
      const result = run(tasks, { totalStudyTime: 1, priorityPercent: 40 })
      expect(totalMinutes(result)).toBe(60)
    })

    it('priority tasks are excluded when priorityPercent is 0', () => {
      // priorityPercent=0 means no budget for priority tasks → they get 0 min and are filtered out
      const tasks = [task({ id: 'p', priority: true }), task({ id: 'n', priority: false })]
      const result = run(tasks, { totalStudyTime: 1, priorityPercent: 0 })
      expect(result.find((t) => t.priority)).toBeUndefined()
      expect(result.find((t) => !t.priority).scheduledMinutes).toBe(60)
    })

    it('non-priority tasks are excluded when priorityPercent is 100', () => {
      const tasks = [task({ id: 'p', priority: true }), task({ id: 'n', priority: false })]
      const result = run(tasks, { totalStudyTime: 1, priorityPercent: 100 })
      expect(result.find((t) => !t.priority)).toBeUndefined()
      expect(result.find((t) => t.priority).scheduledMinutes).toBe(60)
    })

    it('tasks with 0 scheduledMinutes are filtered out', () => {
      // Many tasks, small time — last task may get 0 minutes
      const tasks = Array.from({ length: 100 }, (_, i) => task({ id: String(i) }))
      const result = run(tasks, { totalStudyTime: 0.5 })
      expect(result.every((t) => t.scheduledMinutes > 0)).toBe(true)
    })
  })

  describe('output shape', () => {
    it('result items contain scheduledMinutes', () => {
      const result = run([task()])
      expect(result[0]).toHaveProperty('scheduledMinutes')
    })

    it('priority tasks appear before non-priority tasks', () => {
      const tasks = [
        task({ id: 'n1' }),
        task({ id: 'p1', priority: true }),
        task({ id: 'n2' }),
        task({ id: 'p2', priority: true }),
      ]
      const result = run(tasks, { totalStudyTime: 2, priorityPercent: 50 })
      const firstNonPriorityIndex = result.findIndex((t) => !t.priority)
      const lastPriorityIndex = result.map((t) => t.priority).lastIndexOf(true)
      expect(lastPriorityIndex).toBeLessThan(firstNonPriorityIndex)
    })
  })
})
