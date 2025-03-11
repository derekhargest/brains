import io from 'socket.io-client';
const socket = io('http://localhost:3002');

export async function generateDemoScenario() {
  // 1. Create test memories
  const testMemories = [
    "Remembered meeting with AI team about neural networks",
    "Noted important deadline for project proposal",
    "Saved research paper about attention mechanisms",
    "Bookmarked website about transformer architectures"
  ];
  
  // 2. Store with initial importance
  const stored = await Promise.all(
    testMemories.map(content => 
      memoryService.storeMemory({
        content,
        metadata: { importance: 0.5 }
      })
    )
  );

  // 3. Simulate access patterns
  const accessPatterns = [
    [0,1,2], [0,2,3], [0,1,3], [0,1,2,3], [0,1], [0,3]
  ];

  accessPatterns.forEach(pattern => {
    socket.emit('chat message', {
      message: "Test interaction",
      accessedMemories: pattern.map(i => stored[i].id)
    });
  });

  return stored;
} 