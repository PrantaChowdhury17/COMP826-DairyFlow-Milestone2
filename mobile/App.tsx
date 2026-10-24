import React, {useCallback,useEffect,useState} from 'react';
import {ActivityIndicator,Pressable,ScrollView,Text,TextInput,View} from 'react-native';
import {SafeAreaProvider,SafeAreaView} from 'react-native-safe-area-context';
import {CameraView,useCameraPermissions} from 'expo-camera';
import {SQLiteProvider,useSQLiteContext} from 'expo-sqlite';
import {Button,Pill,palette,styles} from './src/components/UI';
import {completeOffline,initDatabase,pendingOperations,readCows,readTasks,type Cow} from './src/data/database';
import {synchronise,API_URL} from './src/data/sync';
import {currentShift,parseCowQr,prioritiseTasks,type FarmTask,type Role} from './src/domain/rules';
import {StatusBar as ExpoStatusBar} from 'expo-status-bar';

type Screen='login'|'home'|'scan'|'cow'|'task'|'sync';
const USERS={worker:{id:'worker-1',name:'Alex Morgan',label:'Farm Worker'},manager:{id:'manager-1',name:'Taylor Lee',label:'Farm Manager'}} as const;

function AppContent(){
  const db=useSQLiteContext();
  const [screen,setScreen]=useState<Screen>('login');
  const [role,setRole]=useState<Role>('worker');
  const [selectedCow,setSelectedCow]=useState('COW-101');
  const [selectedTask,setSelectedTask]=useState<string|null>(null);
  const [cows,setCows]=useState<Cow[]>([]);
  const [tasks,setTasks]=useState<FarmTask[]>([]);
  const [pending,setPending]=useState(0);
  const [message,setMessage]=useState('');
  const [busy,setBusy]=useState(false);
  const [qrInput,setQrInput]=useState('COW-101');
  const [cameraPermission,requestPermission]=useCameraPermissions();
  const [hasScanned,setHasScanned]=useState(false);
  const refresh=useCallback(async()=>{
    setCows(await readCows(db));setTasks(await readTasks(db));setPending((await pendingOperations(db)).length);
  },[db]);
  useEffect(()=>{refresh().catch(err=>setMessage(`Database error: ${String(err)}`));},[refresh]);
  const user=USERS[role];
  const context={role,userId:user.id,shift:currentShift(new Date().getHours()),cowId:undefined as string|undefined,now:new Date()};
  const ranked=prioritiseTasks(tasks,context);
  const currentCow=cows.find(c=>c.id===selectedCow);
  const cowTasks=prioritiseTasks(tasks,{...context,cowId:selectedCow});
  const activeTask=tasks.find(t=>t.id===selectedTask);
  const navigate=(next:Screen)=>{setMessage('');setScreen(next)};
  const selectQr=(raw:string)=>{
    const id=parseCowQr(raw);
    if(!id || !cows.some(c=>c.id===id)){setMessage('Unknown or invalid cow QR. Try COW-101, COW-102 or COW-103.');return;}
    setSelectedCow(id);setHasScanned(true);navigate('cow');
  };
  const complete=async()=>{
    if(!activeTask)return;
    setBusy(true);
    try{await completeOffline(db,activeTask.id);await refresh();setMessage('Saved on this device. It will remain after app restart until synchronised.');setScreen('cow');}
    catch(err){setMessage(`Could not save: ${String(err)}`)}finally{setBusy(false)}
  };
  const syncNow=async()=>{
    setBusy(true);setMessage('');
    try{const result=await synchronise(db);await refresh();setMessage(result.sent===0?'Nothing pending. All task updates are synced.':`Server acknowledged ${result.acknowledged}/${result.sent} update(s). Rejected: ${result.rejected}.`)}
    catch(err){setMessage(`Sync failed: ${String(err)}. Offline changes are safely retained.`)}finally{setBusy(false)}
  };
  const taskTile=(t:FarmTask)=> <Pressable key={t.id} onPress={()=>{setSelectedTask(t.id);navigate('task')}} style={styles.card}>
    <Text style={styles.cardTitle}>{t.title}</Text><Text style={styles.body}>{t.cowId} · Due {new Date(t.dueAt).toLocaleDateString()}</Text>
    <Pill text={t.priority.toUpperCase()} tone={t.priority==='critical'?'red':'green'}/>
  </Pressable>;
  return <SafeAreaView edges={['top','bottom']} style={{flex:1,backgroundColor:palette.light}}><ExpoStatusBar style="dark"/>
    <View style={{backgroundColor:palette.green,paddingHorizontal:20,paddingTop:12,paddingBottom:14,flexDirection:'row',justifyContent:'space-between',alignItems:'center'}}>
      <Text style={{color:'white',fontWeight:'900',fontSize:21}}>◈ DairyFlow</Text>
      {screen!=='login'&&<Pressable onPress={()=>navigate('home')}><Text style={{color:'#D1E9DC',fontWeight:'700'}}>Dashboard</Text></Pressable>}
    </View>
    <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{paddingBottom:38,flexGrow:1}}>
      <View style={styles.page}>
        {screen==='login'&&<>
          <Text style={styles.heading}>Smarter dairy teamwork</Text><Text style={styles.subtitle}>Context-aware cow tasks designed to keep working when mobile coverage drops.</Text>
          <View style={styles.card}><Text style={styles.cardTitle}>Choose a demo role</Text><Text style={styles.body}>Role selection is for prototype demonstration, not secure authentication.</Text>
            <Button title="Continue as Farm Worker" onPress={()=>{setRole('worker');navigate('home')}} />
            <Button title="Continue as Farm Manager" secondary onPress={()=>{setRole('manager');navigate('home')}}/>
          </View><View style={styles.card}><Text style={styles.cardTitle}>What you can demonstrate</Text><Text style={styles.body}>Scan cow QR → view priority task → save completion offline → restart → synchronise to the server.</Text></View>
        </>}
        {screen==='home'&&<>
          <Text style={styles.heading}>Hello, {user.name.split(' ')[0]}</Text><Text style={styles.subtitle}>{user.label} · {context.shift} shift · {new Date().toLocaleDateString()}</Text>
          <View style={styles.card}><Text style={styles.cardTitle}>Farm overview</Text><Text style={styles.body}>{cows.length} demo cows · {ranked.length} open tasks</Text><Pill text={`${pending} pending sync`} tone={pending?'red':'green'}/><Button title="Scan cow QR" onPress={()=>{setHasScanned(false);navigate('scan')}}/><Button title="Sync status & actions" secondary onPress={()=>navigate('sync')}/></View>
          <Text style={[styles.cardTitle,{marginTop:24}]}>Context-prioritised tasks</Text><Text style={styles.subtitle}>Sorted by urgency, due time, shift and role using explainable rules.</Text>
          {ranked.length ? ranked.map(taskTile) : <Text style={styles.subtitle}>All tasks completed. Great work.</Text>}
          <Text style={[styles.cardTitle,{marginTop:24}]}>Cow directory</Text>
          {cows.map(c=><Pressable key={c.id} style={styles.card} onPress={()=>{setSelectedCow(c.id);navigate('cow')}}><Text style={styles.cardTitle}>{c.name}  ·  {c.id}</Text><Text style={styles.body}>{c.breed}  •  {c.healthNote}</Text></Pressable>)}
          <Button title="Switch demo role" secondary onPress={()=>navigate('login')}/>
        </>}
        {screen==='scan'&&<>
          <Text style={styles.heading}>Scan a cow</Text><Text style={styles.subtitle}>Point the rear camera at a QR containing COW-101, COW-102 or COW-103.</Text>
          {cameraPermission?.granted ? <View style={{height:260,marginTop:20,borderRadius:18,overflow:'hidden'}}><CameraView style={{flex:1}} facing="back" barcodeScannerSettings={{barcodeTypes:['qr']}} onBarcodeScanned={hasScanned?undefined:({data})=>{setHasScanned(true);selectQr(data)}}/></View>
          : <View style={styles.card}><Text style={styles.body}>Camera access is required for real QR scanning.</Text><Button title="Grant camera permission" onPress={()=>requestPermission()}/></View>}
          <View style={styles.card}><Text style={styles.cardTitle}>Test without a printed QR</Text><TextInput value={qrInput} onChangeText={setQrInput} autoCapitalize="characters" style={{borderWidth:1,borderColor:palette.border,borderRadius:10,padding:12,marginTop:12,color:palette.green}}/><Button title="Open typed cow ID" onPress={()=>selectQr(qrInput)}/></View>
        </>}
        {screen==='cow'&&<>
          <Text style={styles.heading}>{currentCow?.name??'Cow not found'}</Text><Text style={styles.subtitle}>{currentCow?.id} · {currentCow?.breed}</Text>
          <View style={styles.card}><Text style={styles.cardTitle}>Current records</Text><Text style={styles.body}>Health: {currentCow?.healthNote}</Text><Text style={styles.body}>Last recorded milk: {currentCow?.lastMilkLitres} L</Text><Pill text="Locally cached — works offline"/></View>
          <Text style={[styles.cardTitle,{marginTop:24}]}>Priority tasks for this cow</Text><Text style={styles.subtitle}>Relevant tasks rise to the top after selecting or scanning a cow.</Text>
          {cowTasks.length?cowTasks.map(taskTile):<View style={styles.card}><Text style={styles.body}>No open tasks for this cow.</Text></View>}
          <Button title="Scan another cow" secondary onPress={()=>{setHasScanned(false);navigate('scan')}} />
        </>}
        {screen==='task'&&<>
          <Text style={styles.heading}>{activeTask?.title}</Text><Text style={styles.subtitle}>{activeTask?.cowId} · {activeTask?.id}</Text>
          <View style={styles.card}><Text style={styles.cardTitle}>Task details</Text><Text style={styles.body}>{activeTask?.note}</Text><Text style={[styles.body,{marginTop:10}]}>Due: {activeTask?.dueAt?new Date(activeTask.dueAt).toLocaleString():''}</Text><Text style={styles.body}>Assigned to: {activeTask?.assignedTo}</Text><Pill text={activeTask?.syncState==='pending'?'PENDING SYNC':'LOCAL RECORD'} tone={activeTask?.syncState==='pending'?'red':'green'}/></View>
          {activeTask?.status==='open'? <Button disabled={busy} title="Complete & save offline" onPress={complete}/>:<View style={styles.card}><Text style={styles.body}>This task is already completed and saved on this device.</Text></View>}
          <Button secondary title="Back to cow profile" onPress={()=>navigate('cow')}/>
        </>}
        {screen==='sync'&&<>
          <Text style={styles.heading}>Sync centre</Text><Text style={styles.subtitle}>A task is committed to SQLite before any network request. The server deduplicates repeated operation IDs.</Text>
          <View style={styles.card}><Text style={styles.cardTitle}>Device status</Text><Pill text={`${pending} pending change(s)`} tone={pending?'red':'green'}/><Text style={[styles.body,{marginTop:8}]}>API: {API_URL}</Text><Button disabled={busy} title={busy?'Synchronising…':'Sync now'} onPress={syncNow}/><Button title="Return to dashboard" secondary onPress={()=>navigate('home')}/></View>
          <View style={styles.card}><Text style={styles.cardTitle}>Offline demonstration</Text><Text style={styles.body}>1. Disable Wi-Fi and mobile data. 2. Complete a task. 3. Close and reopen the app. 4. Check that it stays completed and pending. 5. Restore the connection and tap Sync now. 6. Verify the task in the backend /tasks endpoint.</Text></View>
        </>}
        {busy&&<ActivityIndicator style={{marginTop:20}} color={palette.green}/>}
        {!!message&&<View style={[styles.card,{borderColor:message.toLowerCase().includes('failed')?'#DDA9A4':palette.border}]}><Text style={styles.body}>{message}</Text></View>}
      </View>
    </ScrollView>
  </SafeAreaView>;
}
export default function App(){return <SafeAreaProvider><SQLiteProvider databaseName="dairyflow.db" onInit={initDatabase}><AppContent/></SQLiteProvider></SafeAreaProvider>}
