var express= require('express')
var app =express();
var http = require('http').Server(app);
var io = require('socket.io')(http,{
    pingInterval: 10*1000,
  pingTimeout: 9*1000,
});
var fs=require('fs')
var bodyParser = require('body-parser')
var sorular=require('./sorular')
//-------------cfg--------------
app.use('/public',express.static('public'))
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())
app.use(express.json());
var toplam_ziyaret=0// toplamda ziyaret eden oyuncuları verir.veri tabanında tutulmadıgı için sıfırlanabilir.
var oyunsuresi=60 //saniye

class Oyuncu{
    constructor(name,id){
        this.ekle_oyun=false
        this.isim_ekle=false
        this.id=id
        this.puan=100
        this.name=name
        this.ready=false
        this.index=0
    }
}

class Game{
    constructor(){
        this.beklemesirasi=[]
        this.oyuncular=[]
        this.basladimi=false
    }

    
    
    oyuncu_ekle(name,id){ 
        if(!this.basladimi){
            this.oyuncular[id]=new Oyuncu(name,id)
            this.oyuncular[id].ekle_oyun=true
            console.log('oyuncuid: ' + id+' oyuna eklendi')
        }
        else{
            this.beklemesirasi[id]=new Oyuncu(name,id)
            console.log('oyuncuid: ' + id+' bekleme sırasında"')
            this.beklemesirasi[id].ekle_oyun=true
        }          
    }
console.log('')
    isim_ekle(id,isim){
        console.log('isim ekle')
        if(!this.basladimi){
            if(this.oyuncular[id].ekle_oyun){
                this.oyuncular[id].name=isim
                this.oyuncular[id].ekle_isim=true
            }
            else{
                console.log('Oyuna bağlanmış değilsiniz')
                this.beklemesirasi[id].name=isim
                this.beklemeisim.ekle_isim=true
            }
            
        }else{
            console.log('Oyun zadasdten başlamış')
        }
    }

    ready(id){
        if(this.oyuncular[id]){
            if(this.oyuncular[id].ekle_isim){
                var oyunculr=this.oyuncular
                    oyunculr[id].ready=true
                    console.log(oyunculr[id].id+' hazır')
                    var flag
                    flag=0
                
                    for(var x in oyunculr){
                        if(oyunculr[x].ready==false & this.oyuncular[id].ready!=undefined){
                            flag++
                            break
                        }
                    }

                    if(flag==0){
                        console.log('herkes tamam')
                        for(var i in oyunculr){
                            console.log('Bağlılar->'+oyunculr[i].id)
                        }
                        this.baslat()
                        return true
                    }
                    else{
                        return false
                    }
                
            }else{
                console.log('Daha isim eklemediniz-> ' + id)
                return false
            }
        }
        else{
            console.log('bekleme sırasındasınız!')
        }      
    }

    baslat(){
        if(this.basladimi==false){  
            console.log('oyun başladı')
            this.basladimi=true
            setTimeout(() => {
                this.bitir()
          
            }, 1000*oyunsuresi);
        } 
    }

    bitir(){
        console.log('bitti')
        this.basladimi=false
        //Puanları ve oyuncu isimlerini bir listeye at rP
        var rP=[]
        for(var x in this.oyuncular){
            rP.push({
                'name':this.oyuncular[x].name,
                'puan':this.oyuncular[x].puan,
            }) 
            this.oyuncular[x].puan=100
            this.oyuncular[x].ekle_isim=false
        }

        //oyunculara bittiğini ve puanları bildir.
        
        console.log('Bitti bilgisi gönderilecekler...')
        for(var xx in this.oyuncular){     
            console.log(this.oyuncular[xx].name+'->'+this.oyuncular[xx].puan)
            this.oyuncular[xx].ready=false
            console.log(this.oyuncular[xx].id)
            io.sockets.connected[this.oyuncular[xx].id].emit('bitti',rP)
        }
        //beklemesırasını oyuna dahil et
        for(var xxx in this.beklemesirasi){
            this.oyuncular[xxx]=this.beklemesirasi[xxx]
            console.log(this.beklemesirasi[xxx]+'->'+this.oyuncular[xxx])
        } 
        this.beklemesirasi=[] 
        
        
    }
}


//--------App--------
var games=[]
 games['0']=new Game()
 games['1']=new Game()
 games['2']=new Game()
 games['3']=new Game()
 games['4']=new Game()
 games['5']=new Game()
 games['6']=new Game()
 games['7']=new Game()
 games['8']=new Game()
 games['9']=new Game()
var st=[]//socketlere göre qr

io.sockets.on('connection',(socket)=>{
    var o_qr=st[socket.id]
    socket.on('oyuncu_ekle',(qr)=>{
        toplam_ziyaret++
        o_qr=qr
        if(games[o_qr]){
            console.log('Qr bulundu')
            games[o_qr].oyuncu_ekle('',socket.id)
            console.log('oyuncu eklendi : '+socket.id+' qr: '+o_qr )  
        }       
    })


    socket.on('isim_ekle',(name)=>{
        if(games[o_qr]){
            console.log(socket.id+' ismi-> '+name)
            games[o_qr].isim_ekle(socket.id,name)  
        }
       
    })



    socket.on('ready',()=>{
            if(games[o_qr])  {
                var kontrol=games[o_qr].ready(socket.id)//true dönerse herkes hazır demek
            if(kontrol){
                for(var u in games[o_qr].oyuncular){
                    io.sockets.connected[games[o_qr].oyuncular[u].id].emit('ready','b')//her bir kullanıcı için   
                    console.log('başladı bilgisi gönderildi-> '+games[o_qr].oyuncular[u].id)      
                }              
            }  
            }  
                 
    })




    socket.on('soru',(cvp)=>{
        if(games[o_qr].basladimi){
            var o=games[o_qr].oyuncular[socket.id]//oyuncu
                if(sorular[o.index].cevap==cvp){
                    o.puan++
                }
                else{
                    o.puan--
                }                                        
            
            var rnd=Math.floor(Math.random()*sorular.length)
            var sObj={
                soru:sorular[rnd].soru,
                s0:sorular[rnd].s0,
                s1:sorular[rnd].s1,
                s2:sorular[rnd].s2,
                s3:sorular[rnd].s3,
                puan:games[o_qr].oyuncular[socket.id].puan,
            }
            games[o_qr].oyuncular[socket.id].index=rnd
            io.sockets.connected[socket.id].emit('soru',sObj)
        }
    })      





    socket.on('disconnect',()=>{
        var rO=[]//oyuncular
        var rB=[]//bekleme
        var rSt=[]//soket -qr 
        if(games[o_qr]){
            games[o_qr].oyuncular[socket.id]=undefined
            st[socket.id]=undefined
            games[o_qr].beklemesirasi[socket.id]=undefined
            console.log('qr->'+o_qr+' '+socket.id+' çıkış yaptı')

            for(var y in games[o_qr].oyuncular){//undefined olanları yeni lisiteye almıyoruz.
                if(games[o_qr].oyuncular[y]!=undefined){
                    rO[y]=games[o_qr].oyuncular[y]
                }
                if(st[socket.id]!=undefined){
                    rSt[y]=st[y]
                }
                if(games[o_qr].beklemesirasi[y]!=undefined){
                    rB[y]=games[o_qr].beklemesirasi[y]
                }
            }
            console.log("geriye kalanlar->")
            console.log(rO)
            games[o_qr].oyuncular=rO//yeni listeyi ata     
            st=rSt//yeni soketqr listesini ata
            games[o_qr].beklemesirasi=rB//Bekleme sırasını ata
            }
        else{
            console.log('Böyle bir socket yok')
        }
        
    }) 
})

app.get('/',(req,res)=>{
    console.log("qr : "+req.query.qr + "\t ip : " + req.ip)
    fs.readFile('./public/x.html',(err,data)=>{
        if(!err & req.query.qr!=undefined){
            res.writeHead(200)
            res.end(data)    
        }
        else{
            res.end('Etrafinizda bir QrQuiz qr bulup girmeyi deneyin..')
        }
    })
})

app.get('/veri',(req,res)=>{
    res.write('Soru Sayisi->'+(sorular.length+50) +'\n')
    res.write('Toplam Oyun : '+games.length+'\n')
    res.write('Toplam oyuncu : '+ toplam_ziyaret+'\n')
    res.write('-------Oyun bilgileri-------\n')
    for(i in games){
        
        res.write('Oyun->'+i+'\n')
        res.write('Oyuncular->\n')
        for(j in games[i].oyuncular){
            res.write(games[i].oyuncular[j].id+'\n')
        }
    }
    res.end()
})



http.listen(80, function(){
    console.log('DENEME listening on *:80');
  });