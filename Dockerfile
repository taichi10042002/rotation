# ベースイメージの指定
FROM tomcat:9-jdk17

# 作業ディレクトリの指定
WORKDIR /usr/local/tomcat/webapps

# アプリケーションの WAR ファイルをコピー
COPY target/rotation-ytam-0.0.1-SNAPSHOT.war ./ROOT.war

# ポートのエクスポージャ
EXPOSE 8080

# Tomcat サーバの起動
CMD ["catalina.sh", "run"]