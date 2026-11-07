import React, { useEffect, useState } from 'react';
import { Activity, ArrowLeft, ArrowRight, CalendarDays, CalendarPlus, CheckCircle2, ChevronDown, Clock3, ClipboardList, Cloud, HeartPulse, LayoutDashboard, LogIn, LogOut, MapPin, Menu, Phone, RefreshCw, Search, ShieldCheck, Stethoscope, UserRound, Users, X, AlertTriangle } from 'lucide-react';
import { API_BASE, asAvailableTimes, asList, getToken, services, setToken } from './api';

const formatDate = v => { if (!v) return '—'; const d = new Date(String(v).length === 10 ? `${v}T12:00:00` : v); return Number.isNaN(d.getTime()) ? String(v) : d.toLocaleDateString('es-PE', { day:'2-digit', month:'short', year:'numeric' }); };
const dateIso = () => { const d = new Date(); d.setMinutes(d.getMinutes() - d.getTimezoneOffset()); return d.toISOString().slice(0,10); };
const emptyBooking = { especialidad:'', medicoId:'', fecha:'', hora:'', motivo:'' };
function Field({ label, children, hint }) { return <label className="field"><span>{label}</span>{children}{hint && <small>{hint}</small>}</label>; }
function Status({ children, type='info', onClose }) { return <div role="status" className={`notice ${type}`}><span>{type==='error'?<AlertTriangle size={18}/>:<CheckCircle2 size={18}/>}</span><span>{children}</span>{onClose&&<button aria-label="Cerrar alerta" onClick={onClose}><X size={16}/></button>}</div>; }

export default function App() {
  const [page, setPage] = useState('inicio');
  const [mobile, setMobile] = useState(false);
  const [logged, setLogged] = useState(!!getToken());
  const [profile, setProfile] = useState(null);
  const [formMode, setFormMode] = useState('login');
  const [auth, setAuth] = useState({ nombres:'', apellidoPaterno:'', apellidoMaterno:'', dni:'', telefono:'', fechaNacimiento:'', sexo:'', email:'', password:'' });
  const [booking, setBooking] = useState(emptyBooking);
  const [bookingDoctors, setBookingDoctors] = useState([]);
  const [cancelId, setCancelId] = useState(null);
  const [cancelReason, setCancelReason] = useState('');
  const [availableSlots, setAvailableSlots] = useState([]);
  const [slotsStatus, setSlotsStatus] = useState('idle');
  const [rescheduleSlots, setRescheduleSlots] = useState([]);
  const [rescheduleStatus, setRescheduleStatus] = useState('idle');
  const [editDoctorId, setEditDoctorId] = useState('');
  const [specialties, setSpecialties] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [search, setSearch] = useState('');
  const [edit, setEdit] = useState(null);
  const [newSlot, setNewSlot] = useState({fecha:'',hora:''});
  const [apiState, setApiState] = useState('Comprobando conexión');
  function navigate(next){setPage(next);setMobile(false);setMessage(null);window.scrollTo({top:0,behavior:'smooth'});}
  function notify(text, type='info'){setMessage({text,type});}
  async function refresh(){try{const c=await services.citas();setAppointments(asList(c));}catch(e){notify(`No se pudieron cargar las citas: ${e.message}. Verifica las rutas del backend y CORS.`, 'error');}}
  useEffect(()=>{let mounted=true;fetch(API_BASE+'/actuator/health').then(r=>{if(mounted)setApiState(r.ok?'Servidor disponible':'Servidor no verificado');}).catch(()=>{if(mounted)setApiState('Servidor no verificado');});return()=>{mounted=false;};},[]);
  useEffect(()=>{
    if(!logged)return;
    if(page==='reservar'||page==='medicos')services.especialidades().then(x=>setSpecialties(asList(x))).catch(()=>{});
    if(page==='medicos')services.medicos().then(x=>setDoctors(asList(x))).catch(e=>notify(e.message,'error'));
    if(page==='citas')refresh();
  },[page,logged]);
  useEffect(()=>{
    if(page!=='reservar'||!logged||!booking.especialidad){setBookingDoctors([]);return;}
    let active=true;
    setBookingDoctors([]);
    services.medicosDisponibles(booking.especialidad).then(x=>{if(active)setBookingDoctors(asList(x));}).catch(e=>{if(active)notify(e.message,'error');});
    return ()=>{active=false;};
  },[page,logged,booking.especialidad]);
  useEffect(() => {
    if (page !== 'reservar' || !logged || !booking.medicoId || !booking.fecha) {
      setAvailableSlots([]);
      setSlotsStatus('idle');
      return;
    }
    let active = true;
    setAvailableSlots([]);
    setSlotsStatus('loading');
    services.disponibilidad(booking.medicoId, booking.fecha).then(data => {
      if (active) {
        setAvailableSlots(asAvailableTimes(data));
        setSlotsStatus('ready');
      }
    }).catch(() => {
      if (active) {
        setAvailableSlots([]);
        setSlotsStatus('error');
      }
    });
    return () => { active = false; };
  }, [page, booking.medicoId, booking.fecha]);
  useEffect(() => {
    if (edit === null || !editDoctorId || !newSlot.fecha) {
      setRescheduleSlots([]);
      setRescheduleStatus('idle');
      return;
    }
    let active = true;
    setRescheduleSlots([]);
    setRescheduleStatus('loading');
    services.disponibilidad(editDoctorId, newSlot.fecha).then(data => {
      if (active) {
        setRescheduleSlots(asAvailableTimes(data));
        setRescheduleStatus('ready');
      }
    }).catch(() => {
      if (active) {
        setRescheduleSlots([]);
        setRescheduleStatus('error');
      }
    });
    return () => { active = false; };
  }, [edit, editDoctorId, newSlot.fecha]);
  async function submitAuth(e){
    e.preventDefault();setLoading(true);setMessage(null);
    try{
      const data=formMode==='register' ? await services.registro(auth) : await services.login({email:auth.email,password:auth.password});
      if(!data?.accessToken)throw new Error('El backend no devolvió el token de acceso.');
      setToken(data.accessToken);setProfile(data.usuario||{email:auth.email});setLogged(true);
      navigate('citas');notify(formMode==='register'?'Cuenta creada correctamente.':'Sesión iniciada correctamente.','success');
    }catch(e){notify(e.message,'error');}finally{setLoading(false);}
  }
  async function submitBooking(e){e.preventDefault();if(!logged){navigate('acceso');notify('Inicia sesión antes de registrar una cita.');return;}if(slotsStatus!=='ready'||!availableSlots.includes(booking.hora)){notify('Selecciona un horario disponible para continuar.','error');return;}setLoading(true);setMessage(null);try{const latest=asAvailableTimes(await services.disponibilidad(booking.medicoId,booking.fecha));if(!latest.includes(booking.hora))throw new Error('El horario seleccionado ya no está disponible. Elige otro horario.');await services.crearCita({...booking,medicoId:Number(booking.medicoId)});setBooking(emptyBooking);navigate('citas');notify('La cita fue registrada correctamente.','success');refresh();}catch(e){notify(`No se pudo registrar la cita: ${e.message}`,'error');}finally{setLoading(false);}}
  async function cancelAppointment(e){
    e.preventDefault();
    if(!cancelReason.trim()){notify('Indica el motivo de la cancelación.','error');return;}
    setLoading(true);
    try{await services.cancelar(cancelId,cancelReason.trim());setCancelId(null);setCancelReason('');await refresh();notify('Cita cancelada.','success');}
    catch(e){notify(e.message,'error');}finally{setLoading(false);}
  }
  async function reschedule(e){e.preventDefault();if(!editDoctorId||rescheduleStatus!=='ready'||!rescheduleSlots.includes(newSlot.hora)){notify('Selecciona un horario disponible para reprogramar.','error');return;}setLoading(true);try{const latest=asAvailableTimes(await services.disponibilidad(editDoctorId,newSlot.fecha));if(!latest.includes(newSlot.hora))throw new Error('Ese horario ya no está disponible. Selecciona otro.');await services.reprogramar(edit,{...newSlot});setEdit(null);setEditDoctorId('');notify('Cita reprogramada.','success');await refresh();}catch(e){notify(e.message,'error');}finally{setLoading(false);}}
  function logout(){setToken(null);setProfile(null);setLogged(false);setAppointments([]);navigate('inicio');}
  const displayName = profile?.nombre||profile?.name||profile?.email?.split('@')[0]||'Paciente';
  const specialtyOptions = specialties.map(s=>typeof s==='string'?{id:s,label:s}:{id:s.id??s.nombre??s.name,label:s.nombre??s.name??String(s.id)});
  const filteredDoctors = doctors.filter(d=>([d.nombreCompleto,d.especialidad,d.cmp].filter(Boolean).join(' ')).toLowerCase().includes(search.toLowerCase()));
  const nav=[['inicio','Inicio',LayoutDashboard],['reservar','Reservar cita',CalendarPlus],['medicos','Médicos',Stethoscope],['citas','Mis citas',ClipboardList]];
  return <div className="app">
    <div className="topbar"><div className="container topbar-inner"><span><MapPin size={13}/> Centro de Salud Acapulco · DIRESA Callao</span><span><ShieldCheck size={13}/> Plataforma de atención digital</span></div></div>
    <header className="header"><div className="container navwrap"><button className="brand" onClick={()=>navigate('inicio')} aria-label="Volver al inicio"><span className="brand-icon"><HeartPulse size={27}/></span><span><strong>Salud Acapulco</strong><small>Gestión de citas médicas</small></span></button><nav className={mobile?'navigation open':'navigation'} aria-label="Navegación principal">{nav.map(([p,label,Icon])=><button className={page===p?'active':''} key={p} onClick={()=>navigate(p)}><Icon size={17}/>{label}</button>)}</nav><div className="nav-right">{logged?<button className="account" onClick={logout}><UserRound size={17}/><span>{displayName}</span><LogOut size={16}/></button>:<button className="btn btn-primary login-btn" onClick={()=>navigate('acceso')}><LogIn size={17}/> Iniciar sesión</button>}<button className="menu" aria-label="Abrir menú" onClick={()=>setMobile(!mobile)}>{mobile?<X/>:<Menu/>}</button></div></div></header>
    {message&&<div className="container notice-wrap"><Status type={message.type} onClose={()=>setMessage(null)}>{message.text}</Status></div>}
    {page==='inicio'&&<><main className="hero"><div className="container hero-grid"><div className="hero-copy"><div className="hero-kicker"><span className="hero-kicker-line"/> CENTRO DE SALUD ACAPULCO · CALLAO</div><h1>Tu próxima cita,<br/><em>sin complicaciones.</em></h1><p>Consulta la disponibilidad del personal médico y organiza tus atenciones desde un solo lugar, de forma clara y sencilla.</p><div className="hero-actions"><button className="btn btn-primary btn-lg" onClick={()=>navigate('reservar')}>Agendar una cita <ArrowRight size={19}/></button><button className="btn btn-light btn-lg" onClick={()=>navigate('citas')}><ClipboardList size={18}/> Ver mis citas</button></div><div className="hero-trust"><span><CheckCircle2 size={17}/> Consulta horarios disponibles</span><span><CheckCircle2 size={17}/> Gestiona tus reservas</span></div></div><div className="hero-art"><div className="care-visual"><div className="care-visual__top"><div className="care-visual__mark"><HeartPulse size={23}/></div><span>ACAPULCO <small>GESTIÓN DE CITAS</small></span><span className="care-visual__cross" aria-hidden="true">+</span></div><div className="care-visual__center"><span className="care-visual__eyebrow">ATENCIÓN ORGANIZADA</span><h2>Una cita.<br/>Un horario.<br/><em>Tu tranquilidad.</em></h2><div className="care-visual__line"/></div><div className="care-visual__steps"><div><span>01</span><strong>Elige la especialidad</strong><Stethoscope size={19}/></div><div><span>02</span><strong>Consulta los horarios</strong><CalendarDays size={19}/></div><div><span>03</span><strong>Confirma tu reserva</strong><CheckCircle2 size={19}/></div></div><div className="care-visual__foot"><span>CENTRO DE SALUD ACAPULCO</span><span>CALLAO — PERÚ</span></div></div></div></div></main><section className="container features"><div className="section-caption">NUESTROS SERVICIOS</div><h2>Tu atención, en un solo lugar</h2><p className="section-sub">Accede a las funciones principales de la plataforma.</p><div className="feature-grid"><Feature icon={<CalendarPlus/>} title="Reserva tus citas" desc="Consulta médicos y reserva uno de sus horarios disponibles." action="Agendar ahora" onClick={()=>navigate('reservar')}/><Feature icon={<Stethoscope/>} title="Conoce a los médicos" desc="Consulta los profesionales disponibles para tu atención." action="Ver médicos" onClick={()=>navigate('medicos')}/><Feature icon={<ClipboardList/>} title="Gestiona tus citas" desc="Revisa, reprograma o cancela tus citas desde tu cuenta." action="Mis citas" onClick={()=>navigate('citas')}/></div></section><section className="container steps"><div><div className="section-caption">CÓMO FUNCIONA</div><h2>Organiza tu atención en tres pasos</h2><p>Sigue un proceso ordenado para solicitar una cita.</p></div><div className="steps-list"><span><b>01</b><strong>Inicia sesión</strong><small>Regístrate o accede a tu cuenta.</small></span><span><b>02</b><strong>Elige tu atención</strong><small>Consulta especialidad, médico y horario disponible.</small></span><span><b>03</b><strong>Confirma tu cita</strong><small>Consulta el estado de tu reserva.</small></span></div></section></>}
    {page==='acceso'&&<main className="container inner narrow"><button className="back" onClick={()=>navigate('inicio')}><ArrowLeft size={17}/> Volver al inicio</button><div className="auth-card"><div className="auth-intro"><span className="icon-round"><UserRound/></span><h1>{formMode==='login'?'Bienvenido de nuevo':'Crea tu cuenta'}</h1><p>{formMode==='login'?'Ingresa para consultar y gestionar tus citas médicas.':'Completa tus datos para comenzar a reservar citas.'}</p></div><div className="auth-tabs"><button className={formMode==='login'?'selected':''} onClick={()=>setFormMode('login')}>Iniciar sesión</button><button className={formMode==='register'?'selected':''} onClick={()=>setFormMode('register')}>Registrarme</button></div><form className="form" onSubmit={submitAuth}>{formMode==='register'&&<div className="two-col"><Field label="Nombres"><input required maxLength={100} value={auth.nombres} onChange={e=>setAuth({...auth,nombres:e.target.value})} placeholder="Tus nombres"/></Field><Field label="Apellido paterno"><input required maxLength={60} value={auth.apellidoPaterno} onChange={e=>setAuth({...auth,apellidoPaterno:e.target.value})} placeholder="Apellido paterno"/></Field><Field label="Apellido materno (opcional)"><input maxLength={60} value={auth.apellidoMaterno} onChange={e=>setAuth({...auth,apellidoMaterno:e.target.value})} placeholder="Apellido materno"/></Field><Field label="DNI"><input required inputMode="numeric" minLength={8} maxLength={8} pattern="[0-9]{8}" value={auth.dni} onChange={e=>setAuth({...auth,dni:e.target.value})} placeholder="8 dígitos"/></Field><Field label="Fecha de nacimiento"><input required type="date" max={dateIso()} value={auth.fechaNacimiento} onChange={e=>setAuth({...auth,fechaNacimiento:e.target.value})}/></Field><Field label="Sexo"><select required value={auth.sexo} onChange={e=>setAuth({...auth,sexo:e.target.value})}><option value="">Selecciona una opción</option><option value="FEMENINO">Femenino</option><option value="MASCULINO">Masculino</option></select></Field><Field label="Teléfono (opcional)"><input type="tel" maxLength={20} value={auth.telefono} onChange={e=>setAuth({...auth,telefono:e.target.value})} placeholder="Número de contacto"/></Field></div>}<Field label="Correo electrónico"><input required type="email" autoComplete="email" value={auth.email} onChange={e=>setAuth({...auth,email:e.target.value})} placeholder="ejemplo@correo.com"/></Field><Field label="Contraseña"><input required type="password" minLength={formMode==='register'?8:1} maxLength={72} autoComplete={formMode==='login'?'current-password':'new-password'} value={auth.password} onChange={e=>setAuth({...auth,password:e.target.value})} placeholder="••••••••"/></Field><button disabled={loading} type="submit" className="btn btn-primary btn-full">{loading?'Procesando...':formMode==='login'?'Ingresar a mi cuenta':'Crear cuenta'}<ArrowRight size={17}/></button></form><p className="footnote">Tus datos se transmiten a través del servidor configurado. No ingreses datos reales hasta verificar la integración.</p></div></main>}
    {page==='reservar'&&<main className="container inner"><Heading badge="RESERVAS" title="Agenda tu cita médica" subtitle="Completa los datos para solicitar una atención en nuestro centro de salud."/><div className="booking-layout"><div className="panel"><div className="panel-heading"><span className="step-circle">1</span><div><h3>Datos de la cita</h3><p>Selecciona una especialidad, un médico y un horario disponible.</p></div></div><form className="form booking-form" onSubmit={submitBooking}><Field label="Especialidad / Área de atención"><select required value={booking.especialidad} onChange={e=>setBooking({...booking,especialidad:e.target.value,medicoId:'',hora:''})}><option value="">Selecciona una especialidad</option>{specialtyOptions.map(x=><option key={x.id} value={x.id}>{x.label}</option>)}</select>{specialtyOptions.length===0&&<small>No se pudieron consultar las especialidades.</small>}</Field><Field label="Profesional de salud"><select required disabled={!booking.especialidad||bookingDoctors.length===0} value={booking.medicoId} onChange={e=>setBooking({...booking,medicoId:e.target.value,hora:''})}><option value="">Selecciona un médico de la especialidad</option>{bookingDoctors.filter(d=>d.admiteCitas!==false).map(d=><option key={d.id} value={d.id}>{d.nombreCompleto||'Médico'}{d.especialidad?' — '+d.especialidad:''}</option>)}</select>{booking.especialidad&&bookingDoctors.length===0&&<small>No se encontraron médicos de esta especialidad.</small>}</Field><Field label="Fecha de atención"><input required type="date" min={dateIso()} value={booking.fecha} onChange={e=>setBooking({...booking,fecha:e.target.value,hora:''})}/></Field><div className="field"><span>Horarios disponibles</span>{slotsStatus==='ready'&&availableSlots.length>0?<div className="slot-grid" role="group" aria-label="Selecciona un horario disponible">{availableSlots.map(h=><button type="button" key={h} className={booking.hora===h?'slot-option selected':'slot-option'} aria-pressed={booking.hora===h} onClick={()=>setBooking({...booking,hora:h})}><Clock3 size={15}/>{h}</button>)}</div>:<div className="slot-placeholder">{slotsStatus==='loading'?'Consultando horarios disponibles...':slotsStatus==='error'?'No se pudo consultar la disponibilidad. Intenta nuevamente más tarde.':slotsStatus==='ready'?'No hay horarios disponibles para esa fecha.':!booking.medicoId?'Primero selecciona un médico.':'Selecciona una fecha para consultar horarios.'}</div>}<small>Los horarios se muestran según la disponibilidad del médico.</small></div><Field label="Motivo de consulta (opcional)"><textarea rows="3" maxLength={300} placeholder="Breve descripción de la consulta" value={booking.motivo} onChange={e=>setBooking({...booking,motivo:e.target.value})}/></Field>{!logged&&<Status>Necesitas iniciar sesión para confirmar la reserva.</Status>}<button className="btn btn-primary btn-full" disabled={loading||slotsStatus!=='ready'||!availableSlots.includes(booking.hora)} type="submit">{loading?'Registrando cita...':'Confirmar reserva'}<ArrowRight size={17}/></button></form></div><aside className="sidebar"><div className="side-card mint"><span className="icon-round"><ShieldCheck size={22}/></span><h3>Información para tu visita</h3><p>Recuerda registrar tus datos correctamente para evitar inconvenientes con la programación.</p></div><div className="side-card"><h4><Clock3 size={17}/> Antes de tu cita</h4><ul><li>Llega con anticipación.</li><li>Ten tu documento de identidad.</li><li>Verifica el horario registrado.</li></ul></div></aside></div></main>}
    {page==='medicos'&&<main className="container inner"><Heading badge="PROFESIONALES" title="Nuestro equipo médico" subtitle="Conoce a los profesionales de salud registrados en el sistema."/><div className="searchbox"><Search size={19}/><input placeholder="Buscar médico o especialidad..." value={search} onChange={e=>setSearch(e.target.value)}/></div>{doctors.length===0?<Empty icon={<Stethoscope/>} title="Directorio pendiente de conexión" text="Cuando el endpoint de médicos esté configurado, aquí aparecerán los profesionales registrados. No se muestran médicos ficticios." action="Reservar una cita" onClick={()=>navigate('reservar')}/>:<div className="doctor-list">{filteredDoctors.map(d=><article className="doctor-card" key={d.id}><span className="doctor-avatar"><UserRound size={28}/></span><div><h3>{d.nombreCompleto||'Profesional de salud'}</h3><p>{d.especialidad?.nombre||d.especialidad||'Profesional de salud'}</p></div><button className="btn btn-outline" onClick={()=>{setBooking({...emptyBooking,medicoId:String(d.id),especialidad:String(specialties.find(x=>x.nombre===d.especialidad)?.id??'')});navigate('reservar');}}>Reservar <ArrowRight size={16}/></button></article>)}</div>}</main>}
    {page==='citas'&&<main className="container inner"><div className="heading-row"><Heading badge="MIS RESERVAS" title="Mis citas médicas" subtitle="Consulta, reprograma o cancela tus citas registradas."/><button className="btn btn-primary" onClick={()=>navigate('reservar')}><CalendarPlus size={17}/> Nueva cita</button></div>{!logged?<Empty icon={<LogIn/>} title="Inicia sesión para ver tus citas" text="Accede con tu cuenta para consultar tus reservas." action="Iniciar sesión" onClick={()=>navigate('acceso')}/>:<>{appointments.length===0?<Empty icon={<CalendarDays/>} title="Aún no hay citas para mostrar" text="Puedes reservar una nueva cita o comprobar que el backend esté devolviendo tus reservas." action="Reservar una cita" onClick={()=>navigate('reservar')}/>:<div className="appointments">{appointments.map((a,i)=><article className="appointment" key={a.id??i}><div className="appointment-icon"><CalendarDays/></div><div className="appointment-info"><div className="appointment-title"><h3>{a.medicoEspecialidad||'Consulta médica'}</h3><span className={`status ${String(a.estado||'programada').toLowerCase()}`}>{a.estado||'Programada'}</span></div><p><Stethoscope size={15}/>{a.medico?.nombre||a.medicoNombre||'Profesional por confirmar'}</p><p><CalendarDays size={15}/>{formatDate(a.fechaHora)} · {a.fechaHora?String(a.fechaHora).slice(11,16):'Horario por confirmar'}</p></div><div className="appointment-actions"><button onClick={()=>{setEdit(a.id);setEditDoctorId(String(a.medicoId??''));setNewSlot({fecha:String(a.fechaHora||'').slice(0,10),hora:''});}}><RefreshCw size={15}/> Reprogramar</button><button className="danger" disabled={loading||a.puedeCancelarse===false} onClick={()=>{setCancelId(a.id);setCancelReason('');}}><X size={15}/> Cancelar</button></div></article>)}</div>}<button className="refresh" onClick={refresh}><RefreshCw size={15}/> Actualizar lista</button></>}</main>}
    <footer className="footer"><div className="container footer-main"><div><div className="footer-brand"><HeartPulse size={25}/> Salud Acapulco</div><p>Plataforma digital para la gestión de citas del Centro de Salud Acapulco — DIRESA Callao.</p></div><div><strong>Accesos rápidos</strong><button onClick={()=>navigate('reservar')}>Reservar cita</button><button onClick={()=>navigate('citas')}>Mis citas</button></div><div><strong>Información</strong><span><MapPin size={15}/> Callao, Perú</span><span><ShieldCheck size={15}/> Proyecto académico</span></div></div><div className="container footer-bottom"><span>© {new Date().getFullYear()} Sistema de Gestión de Citas</span><span className="backend-status"><span className={apiState==='Servidor disponible'?'dot green':''}/><Cloud size={14}/>{apiState}</span></div></footer>
    {cancelId!==null&&<div className="modal-backdrop" onClick={()=>setCancelId(null)}><div role="dialog" aria-modal="true" aria-label="Cancelar cita" className="modal" onClick={e=>e.stopPropagation()}><div className="modal-heading"><h3>Cancelar cita</h3><button type="button" aria-label="Cerrar" onClick={()=>setCancelId(null)}><X/></button></div><p>Indica el motivo de la cancelación.</p><form className="form" onSubmit={cancelAppointment}><Field label="Motivo de cancelación"><textarea required rows={3} maxLength={300} value={cancelReason} onChange={e=>setCancelReason(e.target.value)} placeholder="Escribe el motivo"/></Field><button className="btn btn-primary btn-full" disabled={loading||!cancelReason.trim()} type="submit">{loading?'Cancelando...':'Confirmar cancelación'}</button></form></div></div>}
    {edit!==null&&<div className="modal-backdrop" onClick={()=>setEdit(null)}><div role="dialog" aria-modal="true" aria-label="Reprogramar cita" className="modal" onClick={e=>e.stopPropagation()}><div className="modal-heading"><h3>Reprogramar cita</h3><button aria-label="Cerrar" onClick={()=>setEdit(null)}><X/></button></div><p>Selecciona una fecha y un horario disponible del médico.</p><form className="form" onSubmit={reschedule}><Field label="Nueva fecha"><input required type="date" min={dateIso()} value={newSlot.fecha} onChange={e=>setNewSlot({...newSlot,fecha:e.target.value,hora:''})}/></Field><div className="field"><span>Horarios disponibles</span>{rescheduleStatus==='ready'&&rescheduleSlots.length>0?<div className="slot-grid" role="group" aria-label="Horarios para reprogramar">{rescheduleSlots.map(h=><button type="button" key={h} className={newSlot.hora===h?'slot-option selected':'slot-option'} aria-pressed={newSlot.hora===h} onClick={()=>setNewSlot({...newSlot,hora:h})}><Clock3 size={15}/>{h}</button>)}</div>:<div className="slot-placeholder">{!editDoctorId?'No se pudo identificar al médico de la cita.':rescheduleStatus==='loading'?'Consultando horarios...':rescheduleStatus==='error'?'No se pudo consultar la disponibilidad.':rescheduleStatus==='ready'?'No hay horarios disponibles para esta fecha.':'Selecciona una fecha.'}</div>}</div><button className="btn btn-primary btn-full" disabled={loading||rescheduleStatus!=='ready'||!rescheduleSlots.includes(newSlot.hora)} type="submit">{loading?'Guardando...':'Guardar cambios'}</button></form></div></div>}
  </div>;
}
function Feature({icon,title,desc,action,onClick}){return <article className="feature-card"><span className="feature-icon">{icon}</span><h3>{title}</h3><p>{desc}</p><button onClick={onClick}>{action} <ArrowRight size={17}/></button></article>}
function Heading({badge,title,subtitle}){return <div className="page-heading"><div className="section-caption">{badge}</div><h1>{title}</h1><p>{subtitle}</p></div>}
function Empty({icon,title,text,action,onClick}){return <div className="empty"><div className="empty-icon">{icon}</div><h3>{title}</h3><p>{text}</p><button className="btn btn-primary" onClick={onClick}>{action}<ArrowRight size={17}/></button></div>}
