import express from 'express'
import { ConversationService } from '../services/conversationService'

const router = express.Router()

// 创建新对话
router.post('/', async (req, res) => {
  try {
    const { messages } = req.body
    const conversation = await ConversationService.createConversation(messages)
    res.json(conversation)
  } catch (error) {
    res.status(500).json({ error: '创建对话失败' })
  }
})

// 获取对话
router.get('/:id', async (req, res) => {
  try {
    const conversation = await ConversationService.getConversationById(req.params.id)
    if (!conversation) {
      return res.status(404).json({ error: '对话不存在' })
    }
    res.json(conversation)
  } catch (error) {
    res.status(500).json({ error: '获取对话失败' })
  }
})

// 更新对话
router.put('/:id', async (req, res) => {
  try {
    const { messages } = req.body
    const [updatedCount, updatedConversations] = await ConversationService.updateConversation(
      req.params.id,
      messages
    )
    if (updatedCount === 0) {
      return res.status(404).json({ error: '对话不存在' })
    }
    res.json(updatedConversations[0])
  } catch (error) {
    res.status(500).json({ error: '更新对话失败' })
  }
})

// 删除对话
router.delete('/:id', async (req, res) => {
  try {
    const deletedCount = await ConversationService.deleteConversation(req.params.id)
    if (deletedCount === 0) {
      return res.status(404).json({ error: '对话不存在' })
    }
    res.json({ message: '对话已删除' })
  } catch (error) {
    res.status(500).json({ error: '删除对话失败' })
  }
})

export default router
