const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Todo = require('../models/Todo');

// 1. 할일 생성
router.post('/', async (req, res) => {
  try {
    // MongoDB 연결 상태 확인
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({
        success: false,
        message: '데이터베이스에 연결할 수 없습니다. 잠시 후 다시 시도해주세요.',
        error: `MongoDB 연결 상태: ${mongoose.connection.readyState} (0=disconnected, 1=connected, 2=connecting, 3=disconnecting)`
      });
    }

    const { title, description, completed } = req.body;

    // title 필수 체크
    if (!title || title.trim() === '') {
      return res.status(400).json({
        success: false,
        message: '할일 제목(title)은 필수입니다.'
      });
    }

    // 새 할일 생성
    const todo = new Todo({
      title: title.trim(),
      description: description ? description.trim() : '',
      completed: completed || false
    });

    const savedTodo = await todo.save();

    res.status(201).json({
      success: true,
      message: '할일이 성공적으로 생성되었습니다.',
      data: savedTodo
    });
  } catch (error) {
    console.error('할일 생성 오류:', error);
    console.error('에러 상세:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
    
    // MongoDB 연결 에러인 경우 503, 그 외는 500
    const statusCode = error.name === 'MongoServerError' || error.message.includes('buffering timed out') ? 503 : 500;
    
    res.status(statusCode).json({
      success: false,
      message: '할일 생성 중 오류가 발생했습니다.',
      error: error.message
    });
  }
});

// 2. 할일 보여주기 (모든 할일 조회)
router.get('/', async (req, res) => {
  try {
    // MongoDB 연결 상태 확인
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({
        success: false,
        message: '데이터베이스에 연결할 수 없습니다. 잠시 후 다시 시도해주세요.',
        error: `MongoDB 연결 상태: ${mongoose.connection.readyState} (0=disconnected, 1=connected, 2=connecting, 3=disconnecting)`
      });
    }

    const todos = await Todo.find().sort({ createdAt: -1 }); // 최신순 정렬

    res.status(200).json({
      success: true,
      message: '할일 목록을 성공적으로 조회했습니다.',
      count: todos.length,
      data: todos
    });
  } catch (error) {
    console.error('할일 조회 오류:', error);
    console.error('에러 상세:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
    
    // MongoDB 연결 에러인 경우 503, 그 외는 500
    const statusCode = error.name === 'MongoServerError' || error.message.includes('buffering timed out') ? 503 : 500;
    
    res.status(statusCode).json({
      success: false,
      message: '할일 조회 중 오류가 발생했습니다.',
      error: error.message
    });
  }
});

// 3. 할일 수정
router.put('/:id', async (req, res) => {
  try {
    // MongoDB 연결 상태 확인
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({
        success: false,
        message: '데이터베이스에 연결할 수 없습니다. 잠시 후 다시 시도해주세요.',
        error: `MongoDB 연결 상태: ${mongoose.connection.readyState} (0=disconnected, 1=connected, 2=connecting, 3=disconnecting)`
      });
    }

    const { id } = req.params;
    const { title, description, completed } = req.body;

    // MongoDB ObjectId 형식 검증
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: '유효하지 않은 ID 형식입니다.'
      });
    }

    // 할일 찾기
    const todo = await Todo.findById(id);

    if (!todo) {
      return res.status(404).json({
        success: false,
        message: '할일을 찾을 수 없습니다.'
      });
    }

    // 수정할 데이터 준비
    const updateData = {};
    
    if (title !== undefined) {
      if (title.trim() === '') {
        return res.status(400).json({
          success: false,
          message: '할일 제목(title)은 비어있을 수 없습니다.'
        });
      }
      updateData.title = title.trim();
    }

    if (description !== undefined) {
      updateData.description = description.trim();
    }

    if (completed !== undefined) {
      updateData.completed = completed;
    }

    // 할일 수정
    const updatedTodo = await Todo.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true } // new: true는 업데이트된 문서 반환, runValidators: true는 스키마 검증 실행
    );

    res.status(200).json({
      success: true,
      message: '할일이 성공적으로 수정되었습니다.',
      data: updatedTodo
    });
  } catch (error) {
    console.error('할일 수정 오류:', error);
    console.error('에러 상세:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
    
    // MongoDB 연결 에러인 경우 503, 그 외는 500
    const statusCode = error.name === 'MongoServerError' || error.message.includes('buffering timed out') ? 503 : 500;
    
    res.status(statusCode).json({
      success: false,
      message: '할일 수정 중 오류가 발생했습니다.',
      error: error.message
    });
  }
});

// 4. 할일 삭제
router.delete('/:id', async (req, res) => {
  try {
    // MongoDB 연결 상태 확인
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({
        success: false,
        message: '데이터베이스에 연결할 수 없습니다. 잠시 후 다시 시도해주세요.',
        error: `MongoDB 연결 상태: ${mongoose.connection.readyState} (0=disconnected, 1=connected, 2=connecting, 3=disconnecting)`
      });
    }

    const { id } = req.params;

    // MongoDB ObjectId 형식 검증
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: '유효하지 않은 ID 형식입니다.'
      });
    }

    // 할일 찾기 및 삭제
    const todo = await Todo.findByIdAndDelete(id);

    if (!todo) {
      return res.status(404).json({
        success: false,
        message: '할일을 찾을 수 없습니다.'
      });
    }

    res.status(200).json({
      success: true,
      message: '할일이 성공적으로 삭제되었습니다.',
      data: todo
    });
  } catch (error) {
    console.error('할일 삭제 오류:', error);
    console.error('에러 상세:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
    
    // MongoDB 연결 에러인 경우 503, 그 외는 500
    const statusCode = error.name === 'MongoServerError' || error.message.includes('buffering timed out') ? 503 : 500;
    
    res.status(statusCode).json({
      success: false,
      message: '할일 삭제 중 오류가 발생했습니다.',
      error: error.message
    });
  }
});

module.exports = router;
