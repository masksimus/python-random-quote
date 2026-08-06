import{Link,NavLink,Outlet}from'react-router-dom';
const nav=[['/','Главная'],['/draw','Карта дня'],['/archive','Архив'],['/favorites','Избранное'],['/premium','Premium'],['/profile','Профиль'],['/settings','Настройки']];
export function Layout(){return <div className="app"><header className="top"><Link to="/" className="brand">✦ Tarot Day</Link><nav>{nav.map(([to,t])=><NavLink key={to} to={to}>{t}</NavLink>)}</nav></header><main><Outlet/></main><footer><Link to="/policy">Политика</Link><span>·</span><span>VK Mini App ready</span></footer></div>}
export function Card({children}:{children:React.ReactNode}){return <section className="glass">{children}</section>}
