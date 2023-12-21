<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.0.2/dist/css/bootstrap.min.css" rel="stylesheet" integrity="sha384-EVSTQN3/azprG1Anm3QDgpJLIm9Nao0Yz1ztcQTwFspd3yD65VohhpuuCOmLASjC" crossorigin="anonymous">
    <title>ローテーション生成結果</title>
    <style>
    	p{
            font-size:0.7em;
        }
    
        body {
            background: lightskyblue;
            padding-top: 20px; /* 追加 */
        }

        table {
            background: #FF8856;
            width: 100%; /* 追加 */
            max-width: 600px; /* 追加 */
            margin: auto; /* 追加 */
        }

        td {
            width: 33.33%; /* 追加 */
            box-sizing: border-box;
            text-align: center;
            vertical-align: middle;
        }

        .maru {
            height: 90px;
            width: 90px;
            border-radius: 50%;
            line-height: 90px;
            text-align: center;
            background-color: white;
            border: 2px solid black;
            box-sizing: border-box;
            display: inline-block;
            vertical-align: middle;
            font-weight:bold
        }

        textarea {
            display: block;
            margin: 20px auto; /* 修正 */
            max-width: 600px; /* 追加 */
            width: 100%; /* 追加 */
        }

        .heading06 {
            position: relative;
            padding-top: 50px;
            padding-bottom: 50px;
            font-size: 26px;
            text-align: center;
        }

        .heading06 span {
            position: relative;
            z-index: 2;
        }

        .heading06::before {
            content: attr(data-en);
            position: absolute;
            top: -20px;
            left: 50%;
            transform: translateX(-50%);
            color: rgba(224,66,114,0.2);
            font-size: 80px;
            font-style: italic;
        }

        .heading06::after {
            content: '';
            position: absolute;
            bottom: 0;
            left: 50%;
            transform: translate(-50%) rotate(30deg);
            width: 1px;
            height: 40px;
            background-color: rgba(224,66,114,1);
        }

        .modal {
            display: none;
            position: fixed;
            z-index: 1;
            left: 0;
            top: 0;
            height: 100%;
            width: 100%;
            overflow: auto;
            background-color: rgba(0,0,0,0.5);
        }

        .modal-content {
            background-color: #f4f4f4;
            margin: 20% auto;
            width: 80%; /* 修正 */
            box-shadow: 0 5px 8px 0 rgba(0,0,0,0.2),0 7px 20px 0 rgba(0,0,0,0.17);
            animation-name: modalopen;
            animation-duration: 1s;
        }

        @keyframes modalopen {
            from {opacity: 0}
            to {opacity: 1}
        }

        .modal-header {
            background: lightblue;
            padding: 3px 15px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        .modal-header h5 {
            text-align: center;
            margin: 0;
            flex-grow: 1;
            font-size:1em;
        }

        .modalClose {
            font-size: 2rem;
        }

        .modalClose:hover {
            cursor: pointer;
        }

        .modal-body {
            padding: 10px 20px;
            color: black;
            
        }

        .buttons-container {
            display: flex;
            justify-content: center;
            flex-wrap: wrap; /* 追加 */
        }

       
    </style>
</head>

<body class="text-center">
    <div class="container">
        <header class="mb-3">
            <h2 class="heading06" data-en="Rotation">ローテーション生成結果</h2>
        </header>
        <h5>ローテーション：<select name="pulldown" onchange="updateTable(this.value)">
            <option>S1</option>
            <option>S2</option>
            <option>S3</option>
            <option>S4</option>
            <option>S5</option>
            <option>S6</option>
        </select></h5>

        <div id="tableS1">
            <table class="mx-auto">
            
                <tr id="front">
                    <td><div class="maru">${name4}</div></td>
                    <td><div class="maru">${name3}</div></td>
                    <td><div class="maru">${name2}</div></td>
                </tr>

                <tr id="back">
                    <td><div class="maru">${name5}</div></td>
                    <td><div class="maru">${name6}</div></td>
                    <td><div class="maru">${name1}</div></td>
                </tr>
                
            </table>
        </div>

        <div id="tableS2" style="display: none;">
            <table class="mx-auto">
                <tr id="front">
                    <td><div class="maru">${name5}</div></td>
                    <td><div class="maru">${name4}</div></td>
                    <td><div class="maru">${name3}</div></td>
                </tr>

                <tr id="back">
                    <td><div class="maru">${name6}</div></td>
                    <td><div class="maru">${name1}</div></td>
                    <td><div class="maru">${name2}</div></td>
                </tr>
            </table>
        </div>

        <div id="tableS3" style="display: none;">
            <table class="mx-auto">
                <tr id="front">
                    <td><div class="maru">${name6}</div></td>
                    <td><div class="maru">${name5}</div></td>
                    <td><div class="maru">${name4}</div></td>
                </tr>

                <tr id="back">
                    <td><div class="maru">${name1}</div></td>
                    <td><div class="maru">${name2}</div></td>
                    <td><div class="maru">${name3}</div></td>
                </tr>
            </table>
        </div>

        <div id="tableS4" style="display: none;">
            <table class="mx-auto">
               <tr id="front">
                    <td><div class="maru">${name1}</div></td>
                    <td><div class="maru">${name6}</div></td>
                    <td><div class="maru">${name5}</div></td>
                </tr>

                <tr id="back">
                    <td><div class="maru">${name2}</div></td>
                    <td><div class="maru">${name3}</div></td>
                    <td><div class="maru">${name4}</div></td>
                </tr>
            </table>
        </div>

        <div id="tableS5" style="display: none;">
            <table class="mx-auto">
                <tr id="front">
                    <td><div class="maru">${name2}</div></td>
                    <td><div class="maru">${name1}</div></td>
                    <td><div class="maru">${name6}</div></td>
                </tr>

                <tr id="back">
                    <td><div class="maru">${name3}</div></td>
                    <td><div class="maru">${name4}</div></td>
                    <td><div class="maru">${name5}</div></td>
                </tr>
            </table>
        </div>

        <div id="tableS6" style="display: none;">
            <table class="mx-auto">
                <tr id="front">
                    <td><div class="maru">${name3}</div></td>
                    <td><div class="maru">${name2}</div></td>
                    <td><div class="maru">${name1}</div></td>
                </tr>

                <tr id="back">
                    <td><div class="maru">${name4}</div></td>
                    <td><div class="maru">${name5}</div></td>
                    <td><div class="maru">${name6}</div></td>
                </tr>
            </table>
        </div>

        <div class="text-center">
       
            <textarea name="comment" class="mx-auto" cols="62" rows="8" placeholder="memo:"></textarea>
        </div>
        <br>
        
         <!-画面下部のボタンたち>
        <div class="buttons-container">
			<form action="/rotation-ytam.onrender.com" method="get">
				<input type="submit" value="登録画面に戻る">
			</form>
			
			
		
			<input type="submit" id="modalOpen" value="選手交代">
		</div>
  					<div id="easyModal" class="modal">
    					<div class="modal-content">
      						<div class="modal-header">
  								<h5 >交代する選手を編集してください</h5>						
       					 		<span class="modalClose">×</span>
      						</div>
      						
      					<div class="modal-body">
      					<form action="/rotation-ytam.onrender.com/displayRotation" method="get">
        					<p>サーブ順1：<input type="text" name="name1" value="${name1}"></p>
        					<p>サーブ順2：<input type="text" name="name2" value="${name2}"></p>
        					<p>サーブ順3：<input type="text" name="name3" value="${name3}"></p>
        					<p>サーブ順4：<input type="text" name="name4" value="${name4}"></p>
        					<p>サーブ順5：<input type="text" name="name5" value="${name5}"></p>
        					<p>サーブ順6：<input type="text" name="name6" value="${name6}"></p>
        					<p>　&nbsp;&nbsp;リベロ：<input type="text" name="libero1" value="${libero1}"></p>
        					<input type="submit" id="chenge" value="選手交代">
        					</form>
      						</div>
   						 </div>
  					</div>
  
			
			
        <p class="mt-3">Copyright © 2023 RedHawk All Rights Reserved.</p>
    </div>

    <script>

    

    const buttonOpen = document.getElementById('modalOpen');
    const modal = document.getElementById('easyModal');
    const buttonClose = document.getElementsByClassName('modalClose')[0];

    // ボタンがクリックされた時
    buttonOpen.addEventListener('click', modalOpen);
    function modalOpen() {
      modal.style.display = 'block';
    }

    // バツ印がクリックされた時
    buttonClose.addEventListener('click', modalClose);
    function modalClose() {
      modal.style.display = 'none';
    }

    // モーダルコンテンツ以外がクリックされた時
    addEventListener('click', outsideClose);
    function outsideClose(e) {
      if (e.target == modal) {
        modal.style.display = 'none';
      }
    }
    
        function updateTable(selectedValue) {
            document.getElementById('tableS1').style.display = 'none';
            document.getElementById('tableS2').style.display = 'none';
            document.getElementById('tableS3').style.display = 'none';
            document.getElementById('tableS4').style.display = 'none';
            document.getElementById('tableS5').style.display = 'none';
            document.getElementById('tableS6').style.display = 'none';

            if (selectedValue === 'S1') {
                document.getElementById('tableS1').style.display = 'block';
            } else if (selectedValue === 'S2') {
                document.getElementById('tableS2').style.display = 'block';
            } else if (selectedValue === 'S3') {
                document.getElementById('tableS3').style.display = 'block';
            } else if (selectedValue === 'S4') {
                document.getElementById('tableS4').style.display = 'block';
            } else if (selectedValue === 'S5') {
                document.getElementById('tableS5').style.display = 'block';
            } else if (selectedValue === 'S6') {
                document.getElementById('tableS6').style.display = 'block';
            }
        }

     // ページが読み込まれたときに実行される関数
        document.addEventListener('DOMContentLoaded', function () {
            // 全ての<div class="maru">要素に対してクリックイベントを設定
            var maruElements = document.querySelectorAll('.maru');
            maruElements.forEach(function (element) {
                // クリック前の値を保持する変数
                var originalContent = element.innerHTML;

                element.addEventListener('click', function () {
                    if (element.innerHTML !== '${libero1}') {
                        // クリックされたときに${libero1}の値を表示
                        element.innerHTML = '${libero1}';

                        element.style.backgroundColor = 'yellow';
                        
                    } else {
                        // 再度クリックされたときに元の値に戻す
                        element.innerHTML = originalContent;

                        element.style.backgroundColor = 'white';
                    }
                });
            });
        });

    </script>
</body>

</html>
