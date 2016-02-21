/* CatfoOD 2015 yanming-sohu@sohu.com */

package zr.node.db;

import java.sql.ResultSet;
import java.sql.ResultSetMetaData;


public class SelectTool {

	/**
	 * 从结果集中返回结果集的数组, 不负责任何资源的释放
	 */
	public static String[][] select(ResultSet rs, int total) throws Exception {
		String [][] ret = new String[total][];
		ResultSetMetaData md = rs.getMetaData();
		int column = md.getColumnCount();
		int row = 0;
		
		while (rs.next()) {		
			ret[row] = new String[column];
			for (int c = 1; c <= column; ++c) {
				ret[row][c-1] = rs.getString(c);
			}

			if (++row >= total) 
				break;
		}
		
		if (row > 0) {
			return ret;
		}
		
		return null;
	}
}
