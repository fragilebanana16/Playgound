package Proxy;
public class Proxy{
    public static void main(String[] args) {
		Searcher searcher;  //针对抽象编程，客户端无须分辨真实主题类和代理类
		searcher = new ProxySearcher();
		String result = searcher.doSearch("Dickens","Yolo");
        System.out.println(result);
    }
}

interface Searcher {
    public String doSearch(String userid, String keyword);
}

class RealSearcher implements Searcher{
    public String doSearch(String userid, String keyword){
        System.out.println(userid + "`use`" + keyword + "`searched");
        return "searched detail";
    }
}

class ProxySearcher implements Searcher {
	private RealSearcher searcher = new RealSearcher(); //维持一个对真实主题的引用
	private AccessValidator validator;
	private Logger logger;
	
	public String doSearch(String userId,String keyword) {
		//如果身份验证成功，则执行查询
		if (this.validate(userId)) {
			String result = searcher.doSearch(userId,keyword); //调用真实主题对象的查询方法
			this.log(userId); //记录查询日志
			return result; //返回查询结果
		}
		else {
			return null;
		}
	} 
	
	//创建访问验证对象并调用其validate()方法实现身份验证
	public boolean validate(String userId) {
		validator = new AccessValidator();
		return validator.validate(userId);
	}
	
	//创建日志记录对象并调用其log()方法实现日志记录
	public void log(String userId) {
		logger = new Logger();
		logger.log(userId);
	}
}

class AccessValidator {
    public boolean validate(String userId){
        if (userId.equalsIgnoreCase("Dickens")) {
            System.out.println(userId + "`Login success");
            return true;
        }
        else{
            System.out.println(userId + "`Login fail");
            return false;
        }
    }
}

class Logger {
    public void log(String userId){
        System.out.println(userId + "`log record");
    }
}