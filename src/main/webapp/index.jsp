<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.0.2/dist/css/bootstrap.min.css" rel="stylesheet" integrity="sha384-EVSTQN3/azprG1Anm3QDgpJLIm9Nao0Yz1ztcQTwFspd3yD65VohhpuuCOmLASjC" crossorigin="anonymous">
    <title>ローテーション自動生成ツール</title>
    
    
    <style>
        h1 {
            position: relative;
            color: #158b2b;
            font-size: 1.5rem;
            padding: 1rem 0;
            text-align: center;
            margin: 1.5em 0;
        }
        
        h1:before {
            content: "";
            position: absolute;
            top: -0.5rem;
            left: 50%;
            width: 10rem;
            height: 4.5rem;
            border-radius: 50%;
            border: 0.5rem solid #a6ddb0;
            border-left-color: transparent;
            border-right-color: transparent;
            -webkit-transform: translateX(-50%);
            transform: translateX(-50%);
        }

        .btn_30 {
            display: flex;
            align-items: center;
            justify-content: center;
            text-decoration: none;
            margin: auto;
            width: 100%;
            max-width: 20em;
            height: 4em;
            color: #ccc;
            cursor: pointer;
            transition: all 0.85s cubic-bezier(.17,.67,.14,.93);
            transform-style: preserve-3d;
            transform-origin: 100% 50%;
        }

        .btn_30:hover {
            transform: rotateX(-90deg);
        }

        .btn_30 .side {
            box-sizing: border-box;
            position: absolute;
            display: inline-block;
            width: 100%;
            text-align: center;
            padding: 1.2rem 4rem;
            font-weight: bold;
            letter-spacing: 2px;
        }

        .btn_30 .top {
            background: #b4e12b;
            color: #fff;
            transform: rotateX(90deg) translate3d(0, 0, 2em);
        }

        .btn_30 .front {
            background: #27acd9;
            color: #fff;
            transform: translate3d(0, 0, 2em);
        }
        
        p{
            font-size:0.7em;
        }
    </style>
</head>
<body>
    <div class="container text-center">
        <h1 class="my-5">ローテーション自動生成ツール</h1>

        <form id="rotationForm" action="/rotation/displayRotation" method="get">
            <div class="row justify-content-center">
                <div class="col-lg-7 col-md-9 col-sm-12">
                    <table class="table">
                        <tr><td><b>サーブ順</b></td><td><b>選手名</b></td></tr>
                        <tr><td>サーブ順1：</td><td><input type="text" name="name1" placeholder="Setter"></td></tr>
                        <tr><td>サーブ順2：</td><td><input type="text" name="name2" placeholder="OH or MB"></td></tr>
                        <tr><td>サーブ順3：</td><td><input type="text" name="name3" placeholder="OH or MB"></td></tr>
                        <tr><td>サーブ順4：</td><td><input type="text" name="name4" placeholder="Opposite"></td></tr>
                        <tr><td>サーブ順5：</td><td><input type="text" name="name5" placeholder="OH or MB"></td></tr>
                        <tr><td>サーブ順6：</td><td><input type="text" name="name6" placeholder="OH or MB"></td></tr>
                        <tr><td>リベロ：</td><td><input type="text" name="libero1" id="libero1" placeholder="Libero"></td></tr>
                    </table>
                </div>
            </div>
            <a href="javascript:void(0)" class="btn_30" onclick="formSubmit()">
                <span class="side top">開始</span>
                <span class="side front">生成</span>
            </a>
        </form>
    </div>

    <div class="container text-center mt-5">
        <p>Copyright © 2023 RedHawk All Rights Reserved.</p>
    </div>

    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.0.2/dist/js/bootstrap.bundle.min.js" integrity="sha384-d8SoS5W7Gdoj68vZw1o2I2ls81rfgknV5/9PK2MF4aAzjNnGLq8bMSnMydAloFXg" crossorigin="anonymous"></script>
    <script>
    
        function formSubmit() {
            document.getElementById("rotationForm").submit();
        }
    </script>
</body>
</html>
