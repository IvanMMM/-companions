Сервис использует подключение по WS.

##Для регистрации в качестве пассажира используйте обязательные парметры:
from:String

to:String

Например: 
```
127.0.0.1:3000?from=Ветеранов&to=Автово
```

##Для регистрации в качестве вощдителя используйте параметры:
from:String

to:String

role:'driver'

[maxPassengers=4]:Number
Например: 
```
127.0.0.1:3000?from=Ветеранов&to=Автово&role=driver&maxPassengers=2
```

EVENTS:

##joined

Входящее

Сообщение конкретному пользователю содержащее информцацию о комнате и его роли в этой комнате

```
{
	room:{
		this.id = String(16);
		this.from = String;
		this.to = String;
		this.maxPassengers = Number;
		this.passengers = [];
		this.driver = Boolean || String;
	},
	role:'passenger'
}
```

##join

Входящее

Сообщение всей комнате о подключении нового пользователя

```
{
	id:String,
	room:{
		this.id = String(16);
		this.from = String;
		this.to = String;
		this.maxPassengers = Number;
		this.passengers = [];
		this.driver = Boolean || String;
	},
	role:'passenger'
}
```

##leave

Входящее

Сообщение всей комнате о том что участник покинул чат

```
{
	id:String,
	room:{
		this.id = String(16);
		this.from = String;
		this.to = String;
		this.maxPassengers = Number;
		this.passengers = [];
		this.driver = Boolean || String;
	},
	role:'passenger'
}
```
##message

Входящее

Входящий текст

```
{
	id:String,
	room:{
		this.id = String(16);
		this.from = String;
		this.to = String;
		this.maxPassengers = Number;
		this.passengers = [];
		this.driver = Boolean || String;
	},
	text:String
}
```

##message

Входящее

Исходящий текст

```
String
```