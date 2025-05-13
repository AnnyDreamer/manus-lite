export const messageList = {
  task: '创建一个HTML文件',
  type: 'system',
  plan: [
    {
      id: 'step1',
      title: '创建HTML文件',
      type: 'file',
      command: 'touch new_page.html',
      description: '在当前目录下创建一个新的HTML文件',
      status: 'pending',
      liveContent: {
        filepath: 'new_page.html',
        content: ''
      }
    },
    {
      id: 'step2',
      title: '编辑HTML文件',
      type: 'file',
      command:
        'echo \'<!DOCTYPE html>\n<html lang="en">\n<head>\n    <meta charset="UTF-8">\n    <meta name="viewport" content="width=device-width, initial-scale=1.0">\n    <title>Document</title>\n</head>\n<body>\n    <h1>Hello, World!</h1>\n</body>\n</html>\' > new_page.html',
      description: '将HTML模板写入到新创建的文件中',
      status: 'pending',
      liveContent: {
        filepath: 'new_page.html',
        content:
          '<!DOCTYPE html>\n<html lang="en">\n<head>\n    <meta charset="UTF-8">\n    <meta name="viewport" content="width=device-width, initial-scale=1.0">\n    <title>Document</title>\n</head>\n<body>\n    <h1>Hello, World!</h1>\n</body>\n</html>'
      }
    },
    {
      id: 'step3',
      title: '保存HTML文件',
      type: 'file',
      command: "echo 'HTML file has been created and saved.'",
      description: '确认HTML文件已保存',
      status: 'pending',
      liveContent: {
        filepath: 'new_page.html',
        content: ''
      }
    }
  ]
}

const step = {
  event: 'task_start',
  content: {
    taskId: 'e3b46e5a-a628-444d-81ce-c95e50f53e94',
    title: '获取当前页面内容',
    type: 'web',
    command: '获取当前页面的HTML内容',
    description: '通过浏览器的开发者工具或API获取当前页面的HTML源代码',
    status: 'running'
  }
}

const stepResult = {
  event: 'task_results',
  content: [
    {
      taskId: 'c8bb3fa5-b758-4864-84e5-b5044b20d60e',
      status: 'failed',
      error: 'The "paths[1]" argument must be of type string. Received undefined'
    }
  ]
}
