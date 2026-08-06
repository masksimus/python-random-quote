import React from 'react';import{createRoot}from'react-dom/client';import{BrowserRouter}from'react-router-dom';import bridge from'@vkontakte/vk-bridge';import{AdaptivityProvider,AppRoot,ConfigProvider}from'@vkontakte/vkui';import'@vkontakte/vkui/dist/vkui.css';import'./styles.css';import App from'./App';
bridge.send('VKWebAppInit');
createRoot(document.getElementById('root')!).render(<React.StrictMode><ConfigProvider appearance="dark"><AdaptivityProvider><AppRoot><BrowserRouter><App/></BrowserRouter></AppRoot></AdaptivityProvider></ConfigProvider></React.StrictMode>);
