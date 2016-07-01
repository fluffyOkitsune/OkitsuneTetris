(function(){
	var gametime;		// タイマー
	var time;			// テトリミノの落下間隔

	var ctrl;

	var animPlay;				// アニメ再生フラグ
	var animTime = [];			// アニメ再生時間
	var animFrame = [];			// アニメ再生総フレーム数
	var syuenDeg = 0.0;			// 終焉おきつね用

	var okitsuneAnimTime = [];	// アニメ再生時間
	var okitsuneAnimFrame = [];	// アニメ再生総フレーム数
	var okitsuneAnimType = [];	// アニメの種類
	var okitsuneAnimID = 0;		// 配列の引数
	var okitsuneAnimPosX = [];	// アニメを再生する座標
	var okitsuneAnimPosY = [];	// アニメを再生する座標

	var state;			// ゲームの進行状態
	var STATE = {
		INTRO : 0, GAME : 1, GAMEOVER : 2
	}

	var field = [];		// テトリミノを置くフィールド
	var type;			// 操作するテトリミノのタイプ
	var level;			// 落下スピード
	var centerX, centerY;			// 今動かしているテトリミノの中心の座標
	var roundX = [], roundY = [];	// テトリミノの中心以外のブロックの座標
	var next = [];		// 次に出てくるテトリミノ
	var hold = [];

	var numOkitsune;	// 出現したおきつねの数
	var clearOkitsune;	// 消したおきつねの数
	var killedOkitsune;	// 潰したおきつねの数
	var curse = [];		// おきつねの呪いターン数

	var line;			// 消したライン数
	var score;			// スコア
	var highscore;		// ハイスコア

	var item = [];		// アイテムゲットフラグ
	var shadow;			// テトリミノの影の座標

	var tSpin;			// T-SPINフラグ

	var okitsunise;		// おきつね化


	// ドキュメントの設定
	var canvas = document.getElementById('canvas');
	var ctx = canvas.getContext('2d');

	// おきつねキャラチップ画像
	var IMAGE_OKITSUNE = new Image();
	IMAGE_OKITSUNE.src = 'okitsune.gif';

	// NEXT用テトリミノ画像
	var IMAGE_TETROMINO = new Image();
	IMAGE_TETROMINO.src = 'tetromino.gif';

	// アイテムアイコン画像
	var IMAGE_ITEM_ICON = new Image();
	IMAGE_ITEM_ICON.src = 'item.gif';

	// のろいアイコン画像
	var IMAGE_CURSE_ICON = new Image();
	IMAGE_CURSE_ICON.src = 'curse.gif';

	// タイトル画像
	var IMAGE_TITLE = new Image();
	IMAGE_TITLE.src = 'Title.png';

	// 終焉画像
	var IMAGE_SYUEN = new Image();
	IMAGE_SYUEN.src = 'GameOver.png';

	var IMAGE_BG01 = new Image();
	IMAGE_BG01.src = 'BG01.jpg';
	var IMAGE_BG02 = new Image();
	IMAGE_BG02.src = 'BG02.jpg';

	// ----------------------------------------------------------------------
	// イベント
	// ----------------------------------------------------------------------
	document.onkeydown = function (e){
		var key = -1;

		// Mozilla(Firefox, NN) and Opera 
		if (e != null) {
			key = e.which;
		// Internet Explorer 
			e.preventDefault();
			e.stopPropagation();
		} else {
			e.preventDefault();
			key = event.keyCode;
			event.returnValue = false; 
			event.cancelBubble = true; 
		}
		if(ctrl){
			switch(state){
				case STATE["INTRO"] : 
					switch(key){
						case 32 : // Space ゲーム開始
							reStart();
							state = STATE["GAME"];
							makeTetromino(-1);
							break;
					}
					break;
				case STATE["GAME"] : 
					switch(key){
						case 88 : // X 右回転
							// 【のろい】背水 でない
							if(curse[7] == 0){
								if(canRotate('R')){
									// 回転の計算
									for(var i=0 ; i<3 ; i++){
										var tempX = roundX[i];
										var tempY = roundY[i];
										roundX[i] = tempY;
										roundY[i] = -tempX;
									}
									shadow = posShadow();
									if(type == 'T')
										tSpin = true;
								}
							}
							break;
						case 90 : // Z 左回転
							// 【のろい】背水 でない
							if(curse[7] == 0){
								if(canRotate('L')){
									// 回転の計算
									for(var i=0 ; i<3 ; i++){
										var tempX = roundX[i];
										var tempY = roundY[i];
										roundX[i] = -tempY;
										roundY[i] = tempX;
									}
									shadow = posShadow();
									if(type == 'T')
										tSpin = true;
								}
							}
							break;
						case 37 : // ← 左移動
							if(canMoveLeft()){
								centerX--;
								shadow = posShadow();
								if(type == 'T')
									tSpin = false;
							}
							break;
						case 38 : // ↑ ハードドロップ
							hardDropTetromino();
							break;
						case 39 : // → 右移動
							if(canMoveRight()){
								centerX++;
								shadow = posShadow();
								if(type == 'T')
									tSpin = false;
							}
							break;
						case 40 : // ↓ 高速落下
							// 【のろい】奈落
							if(curse[6] > 0)
								hardDropTetromino();
							else
								dropTetromino();
							break;
						case 65 : // ホールドA
							if(canHold && item[2] > 0)
								exchange(0);
							break;
						case 83 : // ホールドS
							if(canHold && item[2] > 1)
								exchange(1);
							break;
						case 68 : // ホールドD
							if(canHold && item[2] > 2)
								exchange(2);
							break;
						case 84 : // タイトルへ
							state = STATE["INTRO"];
							break;
						case 70 : // かくしこまんど
							type = 'F';
							okitsunise = true;
							break
						case 66 : // びぎなーもーど
							item[0] = 100;
							item[1] = 5;
							item[2] = 1;
							break;
					}
					break;

				case STATE["GAMEOVER"] : 
					switch(key){
						case 32 : // Space タイトルへ
							state = STATE["INTRO"];
							break;
					}
					break;
			}
		}
	}

	// 開始
	init();
	window.requestAnimationFrame(loop);

	// 回転できるか
	function canRotate(dir){
		for(var i=0 ; i<3 ; i++){
			var X = roundX[i];
			var Y = roundY[i];
			if(dir == 'R'){
				var TO_X = centerX + Y;
				var TO_Y = centerY - X;
				if(!(0<=TO_X && TO_X<10 && 0<=TO_Y && TO_Y<20))
					return false;
				if(field[TO_X][TO_Y] != '_')
					return false;
			}else if(dir == 'L'){
				var TO_X = centerX - Y;
				var TO_Y = centerY + X;
				if(!(0<=TO_X && TO_X<10 && 0<=TO_Y && TO_Y<20))
					return false;
				if(field[TO_X][TO_Y] != '_')
					return false;
			}
		}
		return true;
	}

	// ゲームループ
	function loop(){
		update();
		draw();
		window.requestAnimationFrame(loop);
	}

	// ----------------------------------------------------------------------
	// 初期化
	// ----------------------------------------------------------------------
	function init(){
		gametime = 0;
		highscore = 0;
		state = STATE["INTRO"];
		reStart();
		// TODO
		// 終焉ブレンド時間
		animFrame[10] = 200;
		// 異界化ブレンド時間
		animFrame[11] = -1;
	}

	// ゲームオーバー後にリトライ
	function reStart(){
		time = 0;
		animPlay = false;
		animTime = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];
		okitsuneAnimTime = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];
		okitsuneAnimType = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];
		okitsuneAnimID = 0;
		okitsuneAnimPosX = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];
		okitsuneAnimPosY = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];
		numOkitsune = 0;
		clearOkitsune = 0;
		killedOkitsune = 0;
		score = 0;
		line = 0;
		level = 1;
		item = [0,0,0,0,0,0,0,0,0,0];
		curse = [0,0,0,0,0,0,0,0,0,0,0];
		hold = ['_', '_', '_'];
		canHold = true;
		okitsunise = false;

		// 潰されアニメリセット
		pressedAnimTime = [0];

		// フィールドの初期化
		for (var i = 0 ; i < 10; i++){
			// 多次元配列が使えないのでちょろまかす
			field[i] = [];
			for (var j = 0 ; j< 20; j++){
				field[i][j] = '_';	
			}
		}

		// テトリミノの出現順番を決める
		for(var i=0 ; i<5 ; i++){
			next[i] = randomType();
		}
	}

	function randomType(){
		while(true){
			var i = Math.floor(Math.random()*8);
			switch(i){
				case 0 : return'O';
				case 1 : return'T';
				case 2 : return'S';
				case 3 : return'Z';
				case 4 : return'L';
				case 5 : return'J';
				case 6 : return'I';
				case 7 : 
					// 【のろい】猟師
					if(curse[0] > 0)
						continue;
					else 
						return'F';
			}
		}
	}
	// ======================================================================
	// 更新
	// ======================================================================
	function update(){
		switch(state){
			case STATE["INTRO"] : 
				intro();
				break;
			case STATE["GAME"] : 
				game();
				break;
			case STATE["GAMEOVER"] : 
				gameover();
				break;
		}
		gametime++;
	}

	// ゲーム開始前の状態
	function intro(){
		ctrl = true;
	}

	// ゲーム中の状態
	function game(){
		var speed = level;

		// 【のろい】猟犬
		if(curse[1] > 0)
			speed += 10

		// 【アイテム】スピードダウン
		if(item[4] > 0){
			speed -= 3
			if(speed < 1)
				speed = 1;
		}

		// テトリミノが落ちるタイミング制御
		if(time > 180/speed){
			time = 0;
			// 【のろい】奈落
			if(curse[6] > 0)
				hardDropTetromino();
			else
				dropTetromino();
		}else{
			if(ctrl)
				time++;	
		}
	}

	// ゲームオーバーの状態
	function gameover(){
	}

	// アイテムゲット
	function getItem(){
		var itemID;
		while(true){
			itemID = Math.floor(Math.random()*9);
			switch (itemID){
				// サポートシャドウ
				case 0 : 
					if(!item[0]){
						item[0] = 10;
						return;
					}
				// NEXTボックス
				case 1 : 
					if(item[1]<5){
						item[1]++; 
						return;
					}
				// HOLDボックス
				case 2 : 
					if(item[2]<3){
						item[2]++; 
						return;
					}
				// ボム
				case 3 : 
					if(item[3]==0){
						item[3] = 1; 
						return;
					}
				// スピードダウン
				case 4 : 
					if(item[4]==0){
						item[4] = 7; 
						return;
					}
				// フィーバー
				case 5 : 
					if(item[5]==0){
						item[5] = 3; 
						return;
					}
				// スコアアップ
				case 6 : 
					if(item[6]==0){
						item[6] = 7; 
						return;
					}
				// おはらい
				case 7 : 
					item[7] = 1;
					curse[0] = 0;
					curse[1] = 0;
					curse[2] = 0;
					curse[3] = 0;
					curse[4] = 0;
					curse[5] = 0;
					curse[6] = 0;
					curse[7] = 0;
					curse[8] = 0;
					curse[9] = 0;
					curse[10] = 0;
					return;
				// いなり
				case 8 : 
					if(item[8]==0){
						item[8] = 3; 
						return;
					}
			}
		}
	}

	// ----------------------------------------------------------------------
	// テトリミノ
	// ----------------------------------------------------------------------
	// テトリミノの生成
	function makeTetromino(id){
		// テトリミノの生成
		centerX = 5;
		centerY = 1;
		if(id == -1)
			type = next[0];
		else
			type = hold[id];

		// 中心以外のテトリミノの相対座標
		switch(type){
			case 'O' :
				roundX[0] = -1;
				roundY[0] = 0;
				roundX[1] = -1;
				roundY[1] = 1;
				roundX[2] = 0;
				roundY[2] = 1;
				break;
			case 'T' :
				roundX[0] = -1;
				roundY[0] = 0;
				roundX[1] = 0;
				roundY[1] = 1;
				roundX[2] = 1;
				roundY[2] = 0;
				break;
			case 'S' :
				roundX[0] = -1;
				roundY[0] = -1;
				roundX[1] = -1;
				roundY[1] = 0;
				roundX[2] = 0;
				roundY[2] = 1;
				break;
			case 'Z' :
				roundX[0] = -1;
				roundY[0] = -1;
				roundX[1] = 0;
				roundY[1] = -1;
				roundX[2] = 1;
				roundY[2] = 0;
				break;
			case 'L' :
				roundX[0] = 0;
				roundY[0] = -1;
				roundX[1] = 0;
				roundY[1] = 1;
				roundX[2] = 1;
				roundY[2] = 1;
				break;
			case 'J' :
				roundX[0] = 0;
				roundY[0] = -1;
				roundX[1] = 0;
				roundY[1] = 1;
				roundX[2] = -1;
				roundY[2] = 1;
				break;
			case 'I' :
				roundX[0] = 0;
				roundY[0] = -1;
				roundX[1] = 0;
				roundY[1] = 1;
				roundX[2] = 0;
				roundY[2] = 2;
				break;
			case 'F' :
				roundX[0] = 0;
				roundY[0] = 0;
				roundX[1] = 0;
				roundY[1] = 0;
				roundX[2] = 0;
				roundY[2] = 0;
				numOkitsune++;
				break;
		}

		// nextをずらす
		for(var i=0 ; i<5 ; i++){
			if(i == 4){
				// 【のろい】呪縛
				if(curse[5] > 0){
					next[i] = Math.floor(Math.random()*2)==0 ? 'S':'Z';
					curse[5]--;
					if(curse[5]==0){
						// 通常に戻る
						for(var i=1 ; i<5 ; i++){
							next[i] = randomType();
						}
					}
				}else
					next[i] = randomType();
			}
			else
				next[i] = next[i+1];
		}
		// 【アイテム】フィーバー
		if(item[5] > 0){
			next = ['I', 'I', 'I', 'I', 'I'];

		// 【アイテム】いなり
		} 
		if(item[8] > 0){
			next = ['F', 'F', 'F', 'F', 'F'];
		}

		// 【アイテム】サポートシャドウ位置計算
		if(item[0] > 0)
			shadow = posShadow();
	}

	// HOLDボックスと交換
	function exchange(id){
		canHold = false;
		var temp = type;
		if(hold[id] == '_'){
			makeTetromino(-1);
		} else {
			makeTetromino(id);
		}
		hold[id] = temp;
	}

	// テトリミノの落下
	function dropTetromino(){
		var b = fixTetromino();
		if(!b){
			shadow = posShadow();
			pressOkitsune();
			centerY++;
			if(type == 'T')
				tSpin = false;
		}
		return b;
	}

	// テトリミノの影の位置計算
	function posShadow(){
		var POS_X = [centerX, centerX + roundX[0], centerX + roundX[1], centerX + roundX[2]];
		var POS_Y = [centerY, centerY + roundY[0], centerY + roundY[1], centerY + roundY[2]];
		
		// ブロックまでの距離
		for (var i = centerY ; i < 20 ; i++){
			if(field[POS_X[0]][i] != 'F' && field[POS_X[0]][i] != '_' || 
				(i + roundY[0]) < 20 && (type == 'F' || field[POS_X[1]][i + roundY[0]] != 'F') && field[POS_X[1]][i + roundY[0]] != '_' ||  
				(i + roundY[1]) < 20 && (type == 'F' || field[POS_X[2]][i + roundY[1]] != 'F') && field[POS_X[2]][i + roundY[1]] != '_' ||  
				(i + roundY[2]) < 20 && (type == 'F' || field[POS_X[3]][i + roundY[2]] != 'F') && field[POS_X[3]][i + roundY[2]] != '_' )
				return i - 1;
		}

		// 一番下までの距離
		var d = POS_Y[0];
		for (var i = 1; i < 4 ; i++){
			if(d < POS_Y[i])
				d = POS_Y[i];
		}
		return 19 - (d - centerY);
	}

	// テトリミノのハードドロップ
	function hardDropTetromino(){
		ctrl = false;
		while(!dropTetromino()){
			// 【のろい】虚無 でないとき有効
			if(curse[9]==0){
				// 【アイテム】スコアアップ
				if(item[6] > 0)
					score += 3;
				else
					score += 1;
				}
		}
		ctrl = true;
	}

	// おきつねをつぶす
	function pressOkitsune(){
		var POS_X = [centerX, centerX + roundX[0], centerX + roundX[1], centerX + roundX[2]];
		var POS_Y = [centerY, centerY + roundY[0], centerY + roundY[1], centerY + roundY[2]];

		// つぶされ
		var pressedOkitsuneID = 0;
		var	killingOkitsune = 0;

		for(var i = 0 ; i < 4 ; i++){
			// おきつねの１マス上のテトリミノが落下
			if(field[POS_X[i]][POS_Y[i] + 1] == 'F'){
				killedOkitsune++;
				killingOkitsune++;

				// おきつねをつぶし更地に
				field[POS_X[i]][POS_Y[i] + 1] = '_';

				// つぶされアニメ有効化
				okitsuneAnimID = (okitsuneAnimID+1)%20;
				if(killedOkitsune>=10){
					okitsuneAnimType[okitsuneAnimID] = 2;
					okitsuneAnimFrame[okitsuneAnimID] = 90;
					okitsuneAnimTime[okitsuneAnimID] = 90;
				} else {
					okitsuneAnimType[okitsuneAnimID] = 0;
					okitsuneAnimFrame[okitsuneAnimID] = 15;
					okitsuneAnimTime[okitsuneAnimID] = 15;
				}
				okitsuneAnimPosX[okitsuneAnimID] = 50 + POS_X[i]*20;
				okitsuneAnimPosY[okitsuneAnimID] = 50 + (POS_Y[i] + 1)*20;

				// おきつねを潰しすぎると異界化
				if(killedOkitsune == 10){
					animTime[11] = animFrame[11];
				}
				// のろい設定
				// 【アイテム】おはらい　がないとき有効
				if(item[7] == 0){
					var curseType;
					// 終焉
					if(killingOkitsune >= 10)
						curseType = 11;
					// 泡沫
					else if(killingOkitsune >= 7)
						curseType = 10;
					// 虚無
					else if(killingOkitsune >= 5)
						curseType = 9;
					// 背水
					else if(killingOkitsune >= 3)
						curseType = 7;
					// 奈落
					else if(killingOkitsune >= 2)
						curseType = 6;
					else
						curseType = Math.floor(Math.random()*10);

					var curseTurn = 2 + Math.floor(Math.random()*4);

					curse[curseType] = curseTurn;
					switch(curseType){
						// 猟師
						case 0 : 
							for(var i = 0 ; i<5 ; i++){
								if(next[i] = 'F')
									next[i] = randomType();
							}
							break;
						// 呪縛
						case 5 : 
							for(var i = 0 ; i<5 ; i++){
								next[i] = Math.floor(Math.random()*2)==0 ? 'S':'Z';
							}
							//フィーバー無効
							item[5] = 0;
							break;

						default : 
							break;
					}
				}
			}
		}
	}

	// テトリミノの固着
	function fixTetromino(){
		if(!canFall()){
			// ゲームオーバー判定
			if(centerY <= 2){
				state = STATE["GAMEOVER"];
				return true;
			}

			// フィールドに書き込む
			field[centerX][centerY] = type;
			field[centerX + roundX[0]][centerY + roundY[0]] = type;
			field[centerX + roundX[1]][centerY + roundY[1]] = type;
			field[centerX + roundX[2]][centerY + roundY[2]] = type;

			// ラインを消去
			elaseLine();

			// 新しいテトリミノを生成
			makeTetromino(-1);

			// ターン経過
			if(item[0] > 0)
				item[0]--;
			if(item[3] > 0)
				item[3]--;
			if(item[4] > 0)
				item[4]--;
			if(item[5] > 0)
				item[5]--;
			if(item[6] > 0)
				item[6]--;
			if(item[7] > 0)
				item[7]--;
			if(item[8] > 0)
				item[8]--;

			if(curse[0] > 0)
				curse[0]--;
			if(curse[1] > 0)
				curse[1]--;
			if(curse[2] > 0)
				curse[2]--;
			if(curse[3] > 0){
				// 【のろい】荒天
				for(var i = 0 ; i < 5 ; i++){
					var X = Math.floor(Math.random()*10);
					var Y = Math.floor(Math.random()*20);
					if(field[X][Y] != 'F')
						field[X][Y] = '_';
				}
				curse[3]--;
			}
			if(curse[4] > 0)
				curse[4]--;
			if(curse[5] > 0)
				curse[5]--;
			if(curse[6] > 0)
				curse[6]--;
			if(curse[7] > 0)
				curse[7]--;
			if(curse[8] > 0)
				curse[8]--;
			if(curse[9] > 0)
				curse[9]--;
			if(curse[10] > 0){
				score = 0;
				curse[10]--;
			}
			// 終焉
			if(curse[11] > 0){
				time = 0;
				animTime[10] = animFrame[10];
				state = STATE["GAMEOVER"];
			}

			// ホールド許可
			canHold = true;
			killingOkitsune = 0;
			okitsunise = false;

			return true;
		}
		return false;
	}

	// テトリミノが下に落ちれるかどうか
	function canFall(){
		var POS_X = [centerX, centerX + roundX[0], centerX + roundX[1], centerX + roundX[2]];
		var POS_Y = [centerY, centerY + roundY[0], centerY + roundY[1], centerY + roundY[2]];

		// 落下先
		var FIELD = [];
		for(var i = 0 ; i < 4 ; i++){
			FIELD[i] = field[POS_X[i]][POS_Y[i] + 1];
		}
		
		// 接地した場合
		for(var i = 0 ; i < 4 ; i++){
			if(POS_Y[i] == 20)
				return false;
		}

		// 他のブロックと接触
		for(var i = 0 ; i < 4 ; i++){
			if(FIELD[i] != '_' && (type == 'F' || FIELD[i] != 'F'))
				return false;
		}
		return true;
	}

	// ラインを消去
	function elaseLine(){
		var numElaseLine = 0;
		for (var j = 19; j > 0 ; j--) {
			if(checkLine(j)){
				for (var i = 0; i < 10 ; i++){
					// 消したおきつねをカウント
					if(field[i][j] == 'F'){
						clearOkitsune++;
						getItem();

						// いなくなるアニメ
						okitsuneAnimID = (okitsuneAnimID+1)%20;
						okitsuneAnimType[okitsuneAnimID] = 1;
						okitsuneAnimFrame[okitsuneAnimID] = 50;
						okitsuneAnimTime[okitsuneAnimID] = 50;
						okitsuneAnimPosX[okitsuneAnimID] = 50 + i*20;
						okitsuneAnimPosY[okitsuneAnimID] = 50 + (j - numElaseLine)*20;
					}
				}
				// ラインをずらす
				for (var k = j; k > 0 ; k--) {
					for (var i = 0; i < 10 ; i++){
						// ラインを消す
						if(k > 0)
							field[i][k] = field[i][k - 1];
						else
							field[i][k] = '_';
					}
				}
			numElaseLine++;
			// レベルUP
			if(line%5 == 0)
				level++;
			// 【のろい】背水 の解除
			if(curse[7] > 0)
				curse[7] = 0;
			// 消した後にずれた部分もチェックしなきゃね
			j++;
			}
		}
		line += numElaseLine;

		if(type == 'T' && tSpinCheck()){
			switch (numElaseLine){
				// T-SPIN ZERO
				case 0 : 
				console.log('T-SPIN');
				break;
				// T-SPIN SINGLE
				case 1 : 
				console.log('T-SPIN 1');
				break;
				// T-SPIN DOUBLE
				case 2 :
				console.log('T-SPIN 2');
				break; 
				// T-SPIN TRIPLE
				case 3 : 
				console.log('T-SPIN 3');
				break;
			}
			if(numElaseLine == 4)
				console.log('TETRIS!');
		}

		// 【のろい】虚無 でないとき有効
		if(curse[9]==0){
			// 【アイテム】スコアアップ
			if(item[6] > 0){
				switch(numElaseLine){
					case 1 : 
						score += 300;
					case 2 : 
						score += 750;
					case 3 : 
						score += 1500;
					case 4 : 
						score += 3000;
				}
			} else {
				switch(numElaseLine){
					case 1 : 
						score += 100;
					case 2 : 
						score += 250;
					case 3 : 
						score += 500;
					case 4 : 
						score += 1000;
				}
			}
		}
	}

	// 横一列にそろっているかチェック
	function checkLine(j){
		for (var i = 0 ; i < 10 ; i++) {
			if(field[i][j] == '_')
				return false;
		}
		return true;
	}

	// T-SPIN条件をチェック
	function tSpinCheck(){
		var i = 0;
		if(tSpin){
			// 左上
			if(centerX == 0 || field[centerX - 1][centerY - 1] != '_')
				i++;
			// 左下
			if(centerX == 0 || centerY == 19 || field[centerX - 1][centerY + 1] != '_')
				i++;
			// 右上
			if(centerX == 9 || field[centerX + 1][centerY - 1] != '_')
				i++;
			// 右下
			if(centerX == 9 || centerY == 19 || field[centerX + 1][centerY + 1] != '_')
				i++;
			}
		if(i>=3)
			return true;
		else 
			return false;
	}

	// 左に移動できるか
	function canMoveLeft(){
		if(centerX == 0  || centerX + roundX[0] == 0 || centerX + roundX[1] == 0 || centerX + roundX[2] == 0 )
			return false;
		else if(field[centerX - 1][centerY] != '_'  || field[centerX + roundX[0] - 1][centerY + roundY[0]] != '_'  || 
				field[centerX + roundX[1] - 1][centerY + roundY[1]] != '_'  || field[centerX + roundX[2] - 1][centerY + roundY[2]] != '_' )
			return false;
		return true;
	}

	// 右に移動できるか
	function canMoveRight(){
		if(centerX == 9  || centerX + roundX[0] == 9 || centerX + roundX[1] == 9 || centerX + roundX[2] == 9 )
			return false;
		else if(field[centerX + 1][centerY] != '_'  || field[centerX + roundX[0] + 1][centerY + roundY[0]] != '_'  || 
				field[centerX + roundX[1] + 1][centerY + roundY[1]] != '_'  || field[centerX + roundX[2] + 1][centerY + roundY[2]] != '_' )
			return false;
		return true;
	}

	// ======================================================================
	// 描画
	// ======================================================================
	function draw(){

		// まわりの闇部分
		if(curse[2] > 0 && !animTime[11])
			ctx.fillStyle = 'ghostwhite';
		else 
			ctx.fillStyle = 'black';
			ctx.fillRect(0, 0, 640, 480);

		//異界化
		if(animTime[11]){
			if(animTime[11] > -200)
				animTime[11]--;	
			ctx.globalAlpha = -animTime[11]/200;
			ctx.drawImage(IMAGE_BG01, 0, 0, 640, 480, 0, 0, 640, 480);
			ctx.globalAlpha = 0.5;

			var colorR = Math.floor(64 + 8*Math.sin(2*Math.PI*(gametime%120)/120));
			var colorG = Math.floor(8 + 8*Math.cos(2*Math.PI*(gametime%120)/120));
			var colorB = Math.floor(8 + 4*Math.cos(2*Math.PI*(gametime%120)/120));

			ctx.fillStyle = 'rgb('+ colorR +','+ colorG +','+ colorB +')';
			ctx.fillRect(0, 0, 640, 480);
			ctx.globalAlpha = 1.0;
		}
		// 枠
		ctx.strokeStyle = 'white';
		ctx.strokeRect(50-1, 50-1, 10*20 + 2, 20*20 + 2);

		if(curse[2] > 0)
			ctx.strokeStyle = 'ghostwhite';
		else
			ctx.fillStyle = 'gray';

		if(animTime[11])
			ctx.globalAlpha = 0.5;
		ctx.fillRect(50, 50, 200, 400);
		ctx.globalAlpha = 1.0;

		// 積まれたブロック
		for(var i=0 ; i<10 ;i++){
			for(var j=0 ; j<20 ; j++){
				if(field[i][j] == 'F'){
					var X0 = 50 + i*20;
					var Y0 = 50 + j*20;
					drawChip(IMAGE_OKITSUNE, X0, Y0, (Math.floor(gametime/20))%3, 0);
				} else if (field[i][j] != '_'){
					drawBlock(false, field[i][j], i, j);
				}
			}
		}
		// 異界化
		if(animTime[11]){
			ctx.globalAlpha = -animTime[11]/200;
			ctx.drawImage(IMAGE_BG02, 50, 50, 200, 400, 50, 50, 200, 400);
			ctx.globalAlpha = 0.5;

			var colorR = Math.floor(64 + 8*Math.cos(2*Math.PI*(gametime%120)/120));
			var colorG = Math.floor(8 + 8*Math.sin(2*Math.PI*(gametime%120)/120));
			var colorB = Math.floor(8 + 4*Math.sin(2*Math.PI*(gametime%120)/120));

			ctx.fillStyle = 'rgb('+ colorR +','+ colorG +','+ colorB +')';
			ctx.fillRect(50, 50, 200, 400);

			for(var i=0 ; i<10 ;i++){
				for(var j=0 ; j<20 ; j++){
					if(field[i][j] == 'F'){
						var X0 = 50 + i*20;
						var Y0 = 50 + j*20;
						drawChip(IMAGE_OKITSUNE, X0, Y0, (Math.floor(gametime/20))%3, 0);
					} else if(field[i][j] == '_'){
						ctx.fillRect(50 + i*20, 50 + j*20, 20, 20);
					}
				}
			}
			ctx.globalAlpha = 1.0;
		}

		drawTetromino();

		// アニメの再生
		for(var i = 0 ; i < 20 ; i++){
			// アニメ再生時間が残っている
			if(okitsuneAnimTime[i] > 0){
				ctrl = false;
				var ANIM_T = okitsuneAnimFrame[i] - okitsuneAnimTime[i];
				var animX = okitsuneAnimPosX[i];
				var animY = okitsuneAnimPosY[i];

				switch(okitsuneAnimType[i]){
					case 0 : // つぶされアニメ
						drawChip(IMAGE_OKITSUNE, animX, animY, Math.floor(ANIM_T/5), 1);
						break;
					case 1 : // いなくなるアニメ
						animX += -2 * ANIM_T;
						animY += 0.1 * ANIM_T * ANIM_T;
						drawChip(IMAGE_OKITSUNE, animX, animY, 0, 2);
						break;
					case 2 : // こっちにくる
						animX += 0.1 * ANIM_T * ANIM_T * Math.cos(Math.atan((240-okitsuneAnimPosY[i])/(320-okitsuneAnimPosX[i])));
						animY += 0.1 * ANIM_T * ANIM_T * Math.sin(Math.atan((240-okitsuneAnimPosY[i])/(320-okitsuneAnimPosX[i])));
						ctx.globalAlpha = okitsuneAnimTime[i]/okitsuneAnimFrame[i];
						ctx.drawImage(IMAGE_OKITSUNE, Math.floor(gametime/20)%3*20, 0, 20, 20, animX, animY, 3.0*ANIM_T, 3.0*ANIM_T);
						ctx.globalAlpha = 1.0;
						break;
				}
				okitsuneAnimTime[i]--;
			} else {
				ctrl = true;
			}
		}
		
		// 【のろい】暗黒
		if(curse[8] > 0){
			ctx.fillStyle = 'black';
			ctx.globalAlpha = 0.9;
			ctx.fillRect(0, 0, 640, 480);
			ctx.globalAlpha = 1.0;
		}

		// スコア表示
		ctx.fillStyle = 'white';
		ctx.fillText("SCORE " + score, 50, 10);
		ctx.fillText("HIGH SCORE " + highscore, 50, 20);
		ctx.fillText("LINE " + line, 50, 30);
		ctx.fillText("LEVEL " + level, 50, 40);

		// NEXTボックス
		// 【のろい】無常 でないとき有効
		if(item[1] > 0 && curse[4] == 0){
			ctx.fillStyle = 'white';
			ctx.fillText("NEXT", 260, 80 + 15);
			ctx.fillStyle = 'gray';
			for(var i = 1 ; i < 5 ; i++){
				ctx.fillRect(260 + (2*i)*20 - 1 , 80 + 20 - 1, 20 + 2, 20 + 2);
			}
			ctx.fillStyle = 'white';
			for(var i = 0 ; i < item[1] ; i++){
				ctx.fillRect(260 + (2*i)*20 - 1 , 80 + 20 - 1, 20 + 2, 20 + 2);
				if(next[i] == 'F')
					drawChip(IMAGE_OKITSUNE, 260 + (2*i)*20, 80 + 20, (Math.floor(gametime/20))%3, 0);
				else
					drawChip(IMAGE_TETROMINO, 260 + (2*i)*20, 80 + 20, typeToInt(next[i]), 0);		
			}
		}

		// HOLDボックス
		if(item[2] > 0){
			ctx.fillStyle = 'white';
			ctx.fillText("HOLD", 260, 120 + 15);
			ctx.fillStyle = 'gray';
			for(var i = 1 ; i < 3 ; i++){
				ctx.fillRect(260 + (2*i)*20 - 1 , 120 + 20 - 1, 20 + 2, 20 + 2);
			}
			ctx.fillStyle = 'white';
			for(var i = 0 ; i < item[2] ; i++){
				ctx.fillRect(260 + (2*i)*20 - 1 , 120 + 20 - 1, 20 + 2, 20 + 2);
				if(hold[i] == 'F')
					drawChip(IMAGE_OKITSUNE, 260 + (2*i)*20, 120 + 20, (Math.floor(gametime/20))%3, 0);
				else
					drawChip(IMAGE_TETROMINO, 260 + (2*i)*20, 120 + 20, typeToInt(hold[i]), 0);		
			}
		}

		// 所持アイテムのアイコン
		ctx.fillStyle = 'white';
		ctx.fillRect(260 - 1 , 40 + 20 - 1, 20 * 9 + 2, 20 + 2);
		ctx.fillText("ITEM", 260, 40 + 15);
		for(var i = 0 ; i < 9 ; i++){
			if(item[i] > 0){
 				drawChip(IMAGE_ITEM_ICON, 260 + 20 * i, 40 + 20, i, 0);
 			}
		}

		// おきつね数
		drawChip(IMAGE_OKITSUNE, 260, 180, (Math.floor(gametime/20))%3, 0);
		ctx.fillStyle = 'white';
		ctx.fillText("OKITSUNE x" + numOkitsune, 260 + 20, 180 + 5);
		ctx.fillText("GOT      x" + clearOkitsune, 260 + 20, 180 + 15);
		ctx.fillText("KILLED   x" + killedOkitsune, 260 + 20, 180 + 25);

		// のろいのアイコン
		ctx.fillStyle = '#777777';
		ctx.fillRect(260 - 1 , 200 + 20 - 1, 20 * 11 + 2, 20 + 2);
		ctx.fillStyle = 'white';
		ctx.fillText("KITSUNE NO NOROI", 260, 200 + 15);
		for(var i = 0 ; i < 11 ; i++){
			if(curse[i] > 0){
				drawChip(IMAGE_CURSE_ICON, 260 + 20 * i, 200 + 20, i, 0);
			}
		}

		// 状態別
		switch(state){
			case STATE["INTRO"] : 
				ctx.drawImage(IMAGE_TITLE, 0, 0, 864, 120, 0, 180, 640, 100);
				ctx.fillStyle = 'black';
				ctx.fillText("PRESS SPACE KEY TO START !!", 80, 161);
				ctx.fillText("PRESS SPACE KEY TO START !!", 81, 161);
				ctx.fillText("PRESS SPACE KEY TO START !!", 81, 160);
				ctx.fillText("PRESS SPACE KEY TO START !!", 81, 159);
				ctx.fillText("PRESS SPACE KEY TO START !!", 80, 159);
				ctx.fillText("PRESS SPACE KEY TO START !!", 79, 159);
				ctx.fillText("PRESS SPACE KEY TO START !!", 79, 160);
				ctx.fillText("PRESS SPACE KEY TO START !!", 79, 161);
				ctx.fillStyle = 'white';
				ctx.fillText("PRESS SPACE KEY TO START !!", 80, 160);
				break;
			case STATE["GAME"] : 
				break;
			case STATE["GAMEOVER"] : 
				ctx.fillStyle = 'red';
				ctx.fillText("GAME OVER", 110, 200);
				// 終焉
				if(curse[11] > 0){
					ctx.globalAlpha = 1.0 - (animTime[10]/animFrame[10]);
					ctx.drawImage(IMAGE_SYUEN, 0, 0, 640, 480, 0, 0, 640, 480);
					ctx.globalAlpha = 1.0;
					if(animTime[10] > 0)
						animTime[10]--;

					// 殺したおきつねが飛んでくる
					if(animTime[10] < 30 && !(time % 90) && killedOkitsune > 0){
						killedOkitsune--;
						time = 0;
						syuenDeg = 2*Math.PI*Math.random();
					}
					if(animTime[10] < 30 && time < 90){
						var posX = 310 + 0.05*time*time*Math.cos(syuenDeg);
						var posY = 230 + 0.05*time*time*Math.sin(syuenDeg);
					ctx.globalAlpha = 1.0 - (time/90.0);
						ctx.drawImage(IMAGE_OKITSUNE, Math.floor(gametime/20)%3*20, 0, 20, 20, posX, posY, 3.0*time, 3.0*time);
					ctx.globalAlpha = 1.0;
						time++;
					}
				}
				break;

		}
	}

	// ----------------------------------------------------------------------
	// テトリミノ
	// ----------------------------------------------------------------------
	// テトリミノの描画
	function drawTetromino(){
		if(type == 'F'){
			// シャドーおきつね
			if(item[0] > 0){
				ctx.globalAlpha = 0.3;
				drawChip(IMAGE_OKITSUNE, 50 + centerX*20, 50 + shadow*20, (Math.floor(gametime/20))%3, 0);
				if(okitsunise){	
					drawChip(IMAGE_OKITSUNE, 50 + (centerX + roundX[0])*20, 50 + (shadow + roundY[0])*20, (Math.floor(gametime/20))%3, 0);
					drawChip(IMAGE_OKITSUNE, 50 + (centerX + roundX[1])*20, 50 + (shadow + roundY[1])*20, (Math.floor(gametime/20))%3, 0);
					drawChip(IMAGE_OKITSUNE, 50 + (centerX + roundX[2])*20, 50 + (shadow + roundY[2])*20, (Math.floor(gametime/20))%3, 0);
				}
				ctx.globalAlpha = 1.0;
			}
			// おきつね
			// 【のろい】黄昏 でないとき有効
			if(curse[2] == 0){
				drawChip(IMAGE_OKITSUNE, 50 + centerX*20, 50 + centerY*20, (Math.floor(gametime/20))%3, 0);
				if(okitsunise){
					drawChip(IMAGE_OKITSUNE, 50 + (centerX + roundX[0])*20, 50 + (centerY + roundY[0])*20, (Math.floor(gametime/20))%3, 0);
					drawChip(IMAGE_OKITSUNE, 50 + (centerX + roundX[1])*20, 50 + (centerY + roundY[1])*20, (Math.floor(gametime/20))%3, 0);
					drawChip(IMAGE_OKITSUNE, 50 + (centerX + roundX[2])*20, 50 + (centerY + roundY[2])*20, (Math.floor(gametime/20))%3, 0);
				}
			}
		} else {
			// シャドーテトリミノ
			if(item[0] > 0){
				ctx.globalAlpha = 0.3;
				drawBlock(true, type, centerX, shadow);
				drawBlock(true, type, centerX + roundX[0], shadow + roundY[0]);
				drawBlock(true, type, centerX + roundX[1], shadow + roundY[1]);
				drawBlock(true, type, centerX + roundX[2], shadow + roundY[2]);
				ctx.globalAlpha = 1.0;
			}
			// テトリミノ
			// 【のろい】黄昏 でないとき有効
			if(curse[2] == 0){
				drawBlock(false, type, centerX, centerY);
				drawBlock(false, type, centerX + roundX[0], centerY + roundY[0]);
				drawBlock(false, type, centerX + roundX[1], centerY + roundY[1]);
				drawBlock(false, type, centerX + roundX[2], centerY + roundY[2]);
			}
		}
	}

	// 画面に表示するブロック
	function drawBlock(s, t, posX, posY){
		ctx.fillStyle = getBlockColor(true, t);
		ctx.fillRect(50 + posX*20, 50 + posY*20, 20, 20);
		ctx.fillStyle = getBlockColor(s, t);
		ctx.fillRect(50 + 2 + posX*20, 50 + 2 + posY*20, 20 - 4, 20 - 4);
	}

	// テトリミノの色
	function getBlockColor(s, t){
		if(!s){
			switch(t){
				case 'O' :
					return 'yellow';
				case 'T' :
					return 'purple';
				case 'S' :
					return 'red';
				case 'Z' :
					return 'green';
				case 'L' :
					return 'blue';
				case 'J' :
					return 'magenta';
				case 'I' :
					return 'cyan';
				default :
					return 'white';
			}
		}else{
			switch(t){
				case 'O' :
					return 'gold';
				case 'T' :
					return 'indigo';
				case 'S' :
					return 'darkred';
				case 'Z' :
					return 'darkgreen';
				case 'L' :
					return 'darkblue';
				case 'J' :
					return 'darkmagenta';
				case 'I' :
					return 'darkcyan';
				default :
					return 'whitesmoke';
			}
		}
	}

	// キャラチップの描画
	function drawChip(img, posX, posY, imgX, imgY){
		ctx.drawImage(img, imgX*20, imgY*20, 20, 20, posX, posY, 20, 20);
	}

	// ======================================================================
	// その他
	// ======================================================================
	// Type -> Int変換
	function typeToInt(i){
		switch(i){
			case 'O' : return 0;
			case 'T' : return 1;
			case 'S' : return 2;
			case 'Z' : return 3;
			case 'L' : return 4;
			case 'J' : return 5;
			case 'I' : return 6;
		}
	}
})()