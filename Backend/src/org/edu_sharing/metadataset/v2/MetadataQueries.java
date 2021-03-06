package org.edu_sharing.metadataset.v2;

import org.alfresco.repo.security.authentication.AuthenticationUtil;
import org.apache.lucene.queryParser.QueryParser;
import org.edu_sharing.alfresco.policy.NodeCustomizationPolicies;
import org.edu_sharing.repository.client.tools.CCConstants;

import java.io.Serializable;
import java.util.List;

public class MetadataQueries implements Serializable {
	private String basequery;
	private boolean allowSearchWithoutCriteria;
	private List<MetadataQuery> queries;

	public static String replaceCommonQueryParams(String query) {
		if(query==null)
			return query;
		return query
				.replace("${educontext}",QueryParser.escape(NodeCustomizationPolicies.getEduSharingContext()))
				.replace("${authority}",QueryParser.escape(AuthenticationUtil.getFullyAuthenticatedUser()));
	}

	public String getBasequery() {
		return replaceCommonQueryParams(basequery);
	}
	public void setBasequery(String basequery) {
		this.basequery = basequery;
	}
	public boolean isAllowSearchWithoutCriteria() {
		return allowSearchWithoutCriteria;
	}
	public void setAllowSearchWithoutCriteria(boolean allowSearchWithoutCriteria) {
		this.allowSearchWithoutCriteria = allowSearchWithoutCriteria;
	}
	public List<MetadataQuery> getQueries() {
		return queries;
	}
	public void setQueries(List<MetadataQuery> queries) {
		this.queries = queries;
	}
	public void overrideWith(MetadataQueries queries2) {
		if(queries2==null)
			return;
		if(queries2.getBasequery()!=null)
			setBasequery(queries2.getBasequery());
		for(MetadataQuery query: queries2.getQueries()){
			int pos=queries.lastIndexOf(query);
			if(pos!=-1){
				queries.get(pos).overrideWith(query);
			}
			else{
				queries.add(query);
			}
		}
	}
	public MetadataQuery findQuery(String queryId) {
		for(MetadataQuery query : queries){
			if(query.getId().equals(queryId)){
				return query;
			}
		}
		throw new IllegalArgumentException("Query id "+queryId+" not found");
	}
}
