package rotation.model;

import java.io.IOException;

import javax.servlet.ServletException;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

@WebServlet("/displayRotation")
public class RotationServlet extends HttpServlet {
    private static final long serialVersionUID = 1L;

    protected void doGet(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        // リクエストパラメータから値を取得
        String name1 = request.getParameter("name1");
        String name2 = request.getParameter("name2");
        String name3 = request.getParameter("name3");
        String name4 = request.getParameter("name4");
        String name5 = request.getParameter("name5");
        String name6 = request.getParameter("name6");
        String libero1 = request.getParameter("libero1");
        

       

        // 取得した値をリクエスト属性にセット
        request.setAttribute("name1", name1);
        request.setAttribute("name2", name2);
        request.setAttribute("name3", name3);
        request.setAttribute("name4", name4);
        request.setAttribute("name5", name5);
        request.setAttribute("name6", name6);
        request.setAttribute("libero1", libero1);
        
        
      

        // 取得した値を表示するJSPページにリクエストをフォワード
        request.getRequestDispatcher("/WEB-INF/jsp/displayRotation.jsp").forward(request, response);
    }

    // 他のメソッドは変更なし
}


