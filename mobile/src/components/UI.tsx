import React from 'react';
import {Pressable,Text,View,StyleSheet,type ViewStyle} from 'react-native';
export const palette={green:'#173F39',mint:'#E9F4E9',light:'#F7F9F6',border:'#DDE7DD',muted:'#64766C',danger:'#B34A37',white:'#FFFFFF'};
export const styles=StyleSheet.create({page:{flex:1,backgroundColor:palette.light,paddingHorizontal:20,paddingTop:18},heading:{fontSize:29,fontWeight:'800',color:palette.green},subtitle:{color:palette.muted,fontSize:14,marginTop:6,lineHeight:21},card:{backgroundColor:palette.white,borderRadius:18,padding:17,borderWidth:1,borderColor:palette.border,marginTop:14},cardTitle:{fontSize:18,fontWeight:'700',color:palette.green},body:{fontSize:14,color:'#31443B',lineHeight:21},button:{backgroundColor:palette.green,paddingVertical:14,paddingHorizontal:19,borderRadius:13,alignItems:'center',marginTop:12},secondaryButton:{backgroundColor:palette.mint,borderWidth:1,borderColor:palette.border,paddingVertical:13,paddingHorizontal:18,borderRadius:13,alignItems:'center',marginTop:12},buttonLabel:{color:palette.white,fontWeight:'700',fontSize:15},secondaryLabel:{color:palette.green,fontWeight:'700',fontSize:15}});
export function Button({title,onPress,secondary=false,disabled=false}:{title:string;onPress:()=>void;secondary?:boolean;disabled?:boolean}) {
  return <Pressable accessibilityRole="button" disabled={disabled} onPress={onPress} style={[secondary?styles.secondaryButton:styles.button,disabled?{opacity:.5}:{}]}><Text style={secondary?styles.secondaryLabel:styles.buttonLabel}>{title}</Text></Pressable>;
}
export function Pill({text,tone='green'}:{text:string;tone?:'green'|'red'|'gray'}) {
  const bg=tone==='red'?'#FDE9E5':tone==='gray'?'#EDF0EB':palette.mint;
  const fg=tone==='red'?palette.danger:tone==='gray'?palette.muted:palette.green;
  return <View style={{backgroundColor:bg,alignSelf:'flex-start',paddingVertical:5,paddingHorizontal:9,borderRadius:99,marginTop:6}}><Text style={{fontSize:11,fontWeight:'800',color:fg}}>{text}</Text></View>;
}
