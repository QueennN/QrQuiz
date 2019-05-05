var express= require('express')
var app =express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var fs=require('fs')
var bodyParser = require('body-parser')
var sorular=require('./sorular')
//-------------cfg--------------
app.use('/public',express.static('public'))
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())
app.use(express.json());
var toplam_ziyaret=0// toplamda ziyaret eden oyuncuları verir.veri tabanında tutulmadıgı için sıfırlanabilir.

class Oyuncu{
    constructor(name,id){
        this.id=id
        this.puan=100
        this.name=name
        this.ready=false
        this.index=-1
    }
}

class Game{
    constructor(){
        this.beklemesirasi=[]
        this.oyuncular=[]
        this.basladimi=false
    }


    oyuncu_ekle(name,id){ 
        if(this.basladimi==false){
            this.oyuncular[id]=new Oyuncu(name,id)
            console.log('oyuncuid: ' + id+' oyuna eklendi')
        }
        else{
            this.beklemesirasi[id]=new Oyuncu(name,id)
            console.log('oyuncuid: ' + id+' bekleme sırasında"')
        }          
    }
    isim_ekle(id,isim){
        console.log('isim ekle')
        if(this.basladimi==false){
            this.oyuncular[id].name=isim
        }
    }
    ready(id){
        if(this.basladimi==false & this.oyuncular[id].ready!=undefined){
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
            console.log('ready veremezsin-> ' + id)
            return false
        }
        
    }

    baslat(){
        if(this.basladimi==false){  
            console.log('oyun başladı')
            this.basladimi=true
            setTimeout(() => {
                this.bitir()
          
            }, 1000*60);
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
        }

        //oyunculara bittiğini ve puanları bildir.
        if(io.sockets.connected.length!=0){
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
}


//--------App
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
    console.log('baglandi')
    var o_qr=st[socket.id]
     st[socket.id]=''
    socket.on('oyuncu_ekle',(qr)=>{
        toplam_oyuncu++
        o_qr=qr
        if(games[o_qr]){
            console.log('Qr bulundu')
            games[o_qr].oyuncu_ekle('',socket.id)
            console.log('oyuncu eklendi : '+socket.id+' qr: '+o_qr )
            socket.on('isim_ekle',(name)=>{
                console.log('İsim eklendi'+name)
                
                console.log(socket.id)
                games[o_qr].isim_ekle(socket.id,name)
                
                socket.on('ready',()=>{
                    if(games[o_qr].basladimi==true){
                        io.sockets.connected[socket.id].emit('ready','Oyun zaten başladı')
                    }else{
                        var kontrol=games[o_qr].ready(socket.id)//true dönerse herkes hazır demek
                        if(kontrol==true){
                            for(var x in games[o_qr].oyuncular){
                                io.sockets.connected[games[o_qr].oyuncular[x].id].emit('ready','basladi')//her bir kullanıcı için   
                                console.log('başladı bilgisi gönderildi-> '+games[o_qr].oyuncular[x].id)
                                  
                            }
                            socket.on('soru',(s_obj)=>{
                                if(games[o_qr].basladimi){
                                    var o=games[o_qr].oyuncular[socket.id]//oyuncu
                                    if(o.index!=-1 ){
                                        if(sorular[o.index].cevap==s_obj.cvp){
                                            games[o_qr].oyuncular[socket.id].puan++
                                        }
                                        else{
                                            games[o_qr].oyuncular[socket.id].puan--
                                        }
                                        
                                    }
                                    else{
                                    }
                                    var rnd=Math.floor(Math.random()*(sorular.length))
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
                        } 
                    }  
                })
            })
        }
        
    })
    socket.on('disconnect',()=>{
        var rO=[]
        var rSt=[]
        if(games[o_qr]){
            games[o_qr].oyuncular[socket.id]=undefined
        st[socket.id]=undefined
        console.log('qr->'+o_qr+' '+socket.id+' çıkış yaptı')

        for(var y in games[o_qr].oyuncular){//undefined olanları yeni lisiteye almıyoruz.
            if(games[o_qr].oyuncular[y]!=undefined){
                rO[y]=games[o_qr].oyuncular[y]
            }
            if(st[socket.id]!=undefined){
                rSt[y]=st[y]
            }
        }
        console.log("geriye kalanlar->")
        console.log(rO)
        games[o_qr].oyuncular=rO//yeni listeyi ata     
        st=rSt//yeni soketqr listesini ata
        }
        else{
            console.log('Böyle bir socket yok')
        }
        
    }) 
})

app.get('/',(req,res)=>{
    console.log("qr : "+req.query.qr + "\tip : " + req.ip)
    fs.readFile('./public/index.html',(err,data)=>{
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
    res.write('Toplam Oyun : '+games.length+'\n')
    res.write('Toplam oyuncu : '+ toplam_oyuncu+'\n')
    res.write('-------Oyun bilgileri-------\n')
    for(i in games){
        res.write('Oyun->'+i+'\n')
        res.write('Oyuncular->\n')
        for(j in games[i].oyuncular){
            res.write(games[i].oyuncular[j].name+'\n')
        }
    }
    res.end()
})





//123

var port = 8992;
const { exec } = require('child_process');




app.post('/', function (request, response) {
    //console.log(request.body); 
    if(request.headers['x-github-event']){
       if(request.headers['x-github-event'] == 'push'){
        exec('cd /home/pi/Desktop/qrquiz && git fetch && git reset --hard origin/master',(err,stdout,stderr) =>{
            console.log(err);
            console.log(stdout);
            console.log(stderr);
		    console.log(new Date().toISOString()+' : pulled');
        });
           response.status(200);
       }
    }else{
        response.status(500);
    }
    response.end();   
});



 exec('cd /home/pi/Desktop/qrquiz && git fetch && git reset --hard origin/master',(err,stdout,stderr) =>{

            console.log(err);
            console.log(stdout);
            console.log(stderr);
		console.log(new Date().toISOString()+' : pulled');
        
        });


















        app.listen(port);


http.listen(80, function(){
    console.log('DENEME listening on *:80');
  });