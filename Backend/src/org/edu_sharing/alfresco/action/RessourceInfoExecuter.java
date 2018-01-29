package org.edu_sharing.alfresco.action;

import java.io.InputStream;
import java.util.ArrayList;
import java.util.List;

import javax.xml.xpath.XPath;
import javax.xml.xpath.XPathConstants;
import javax.xml.xpath.XPathFactory;

import org.alfresco.model.ContentModel;
import org.alfresco.repo.action.executer.ActionExecuterAbstractBase;
import org.alfresco.service.cmr.action.Action;
import org.alfresco.service.cmr.action.ActionService;
import org.alfresco.service.cmr.action.ParameterDefinition;
import org.alfresco.service.cmr.repository.ContentData;
import org.alfresco.service.cmr.repository.ContentReader;
import org.alfresco.service.cmr.repository.ContentService;
import org.alfresco.service.cmr.repository.NodeRef;
import org.alfresco.service.cmr.repository.NodeService;
import org.alfresco.service.namespace.QName;
import org.apache.commons.compress.archivers.ArchiveEntry;
import org.apache.commons.compress.archivers.zip.ZipArchiveInputStream;
import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.w3c.dom.Document;

public class RessourceInfoExecuter extends ActionExecuterAbstractBase {

	/** The logger */
	private static Log logger = LogFactory.getLog(RessourceInfoExecuter.class);
	
	
	/** The name of the action */
	public static final String NAME = "cc-ressourceinfo-action";

	/**
	 * the node service
	 */
	private NodeService nodeService;

	private ContentService contentService;
	
	private ActionService actionService = null;
	
	public static final String CCM_ASPECT_RESSOURCEINFO = "{http://www.campuscontent.de/model/1.0}ressourceinfo";
	
	public static final String CCM_PROP_IO_RESSOURCETYPE = "{http://www.campuscontent.de/model/1.0}ccressourcetype";
	public static final String CCM_PROP_IO_RESSOURCEVERSION = "{http://www.campuscontent.de/model/1.0}ccressourceversion";
	
	public static final String CCM_PROP_IO_RESOURCESUBTYPE ="{http://www.campuscontent.de/model/1.0}ccresourcesubtype";
	

	protected void executeImpl(Action action, NodeRef actionedUponNodeRef) {

		Object obj = nodeService.getProperty(actionedUponNodeRef, ContentModel.PROP_CONTENT);
		ContentReader contentreader = this.contentService.getReader(actionedUponNodeRef, ContentModel.PROP_CONTENT);
		
		if(contentreader != null){
			logger.info(contentreader.getMimetype());
			
			
			
			InputStream is = contentreader.getContentInputStream();
			
			 try
	         {
	             //ZipInputStream zip = new ZipInputStream( is );
	             
				 ZipArchiveInputStream zip = new ZipArchiveInputStream(is,contentreader.getEncoding(),true);
				  
	             ArchiveEntry current = null;
	             while ( (current = zip.getNextEntry()) != null )
	             {
	                 if ( current.getName().equals( "imsmanifest.xml" ) )
	                 {
	                     
	                     process(zip,contentreader,actionedUponNodeRef);
	                     zip.close();
	                     return;
	                    
	                 }
	                 
	                 if( current.getName().equals( "moodle.xml" ) ){
	                	 processMoodle(zip,contentreader,actionedUponNodeRef);
	                     zip.close();
	                     return;
	                 }
	                 
	                 if( current.getName().equals( "moodle_backup.xml" ) ){
	                	 processMoodle2_0(zip,contentreader,actionedUponNodeRef);
	                     zip.close();
	                     return;
	                 }
	             }
	             
	             zip.close();
	         }
	         catch ( Exception e )
	         {
	             e.printStackTrace();
	         }
		}
		
		
	}
	
	private void process(InputStream is, ContentReader contentreader, NodeRef actionedUponNodeRef){
		Document doc =  new RessourceInfoTool().loadFromStream(is);
		if ((contentreader.getMimetype().equals("application/zip") || contentreader.getMimetype().equals("application/save-as") || contentreader.getMimetype().equals("application/x-zip-compressed")) && doc != null) {
			try {
				String ressourceType = null;
				String ressourceVersion = null;
				XPathFactory pfactory = XPathFactory.newInstance();
				XPath xpath = pfactory.newXPath();
				String schemaPath = "/manifest/metadata/schema";
				String schemaVersPath = "/manifest/metadata/schemaversion";
				String schema = (String) xpath.evaluate(schemaPath, doc, XPathConstants.STRING);
				String schemaVers = (String) xpath.evaluate(schemaVersPath, doc, XPathConstants.STRING);
				if(schema == null || schema.trim().equals("") || schemaVers == null || schemaVers.trim().equals("")){
					//scorm
					String spath = "/manifest/organizations/organization[position()=1]/metadata/schema";
					String svpath = "/manifest/organizations/organization[position()=1]/metadata/schemaversion";
					schema = (String) xpath.evaluate(spath, doc, XPathConstants.STRING);
					schemaVers = (String) xpath.evaluate(svpath, doc, XPathConstants.STRING);
					
					if(schema == null || schema.trim().equals("") || schemaVers == null || schemaVers.trim().equals("")){
						spath = "/manifest/resources/resource[position()=1]/metadata/schema";
						svpath = "/manifest/resources/resource[position()=1]/metadata/schemaversion";
						schema = (String) xpath.evaluate(spath, doc, XPathConstants.STRING);
						schemaVers = (String) xpath.evaluate(svpath, doc, XPathConstants.STRING);
					}
				}
				
				logger.info("schema:"+schema);
				logger.info("schemaVers:"+schemaVers);
				
				ArrayList<RessourceInfoTool.QTIInfo> isQtiList = new RessourceInfoTool().isQti(doc, xpath);
				if(isQtiList.size() > 0){
					//take the first qtiInfo
					ressourceType = isQtiList.get(0).getType();
					ressourceVersion = isQtiList.get(0).getVersion();
				}else{
					ressourceType = schema;
					ressourceVersion = schemaVers;
				}
				logger.info("ressourceType:"+ressourceType);
				logger.info("ressourceVersion:"+ressourceVersion);
				
				if(ressourceType != null && !ressourceType.trim().equals("") && ressourceVersion != null && !ressourceVersion.trim().equals("")){
					if (this.nodeService.hasAspect(actionedUponNodeRef, QName.createQName(CCM_ASPECT_RESSOURCEINFO)) == false)
			        {
			            this.nodeService.addAspect(actionedUponNodeRef, QName.createQName(CCM_ASPECT_RESSOURCEINFO), null);
			        }
					
					nodeService.setProperty(actionedUponNodeRef, QName.createQName(CCM_PROP_IO_RESSOURCETYPE), ressourceType);
					nodeService.setProperty(actionedUponNodeRef, QName.createQName(CCM_PROP_IO_RESSOURCEVERSION), ressourceVersion);
					if(isQtiList.size() > 0){
						ArrayList<String> qtiInfoSubtypeList = new ArrayList<String>();
						for(RessourceInfoTool.QTIInfo qtiInfo : isQtiList){
							String subtype = qtiInfo.getSubtype();
							if(subtype != null && !subtype.trim().equals("") && !qtiInfoSubtypeList.contains(subtype)){
								qtiInfoSubtypeList.add(subtype);
							}
						}
						//we only need test,questonair or item
						if(qtiInfoSubtypeList.size() > 1){
							qtiInfoSubtypeList.remove("item");
						}
						
						if(qtiInfoSubtypeList.size() > 0){
							nodeService.setProperty(actionedUponNodeRef, QName.createQName(CCM_PROP_IO_RESOURCESUBTYPE), qtiInfoSubtypeList);
						}
					}
					
				}
				
				
				/**
				 * wenn qti content suche nach content file und setzte content damit es indiziert wird
				 */
				if(isQtiList.size() > 0){
					
					logger.info("it is an qti. so we are doing some content indexing");
				
					Action action = actionService.createAction("cc-zipcontent-indexer-action");
					/*if (parameters != null) {
						for (Object key : parameters.keySet()) {
							action.setParameterValue((String) key, (Serializable) parameters.get(key));
						}
					}*/
					actionService.executeAction(action, actionedUponNodeRef);
				}else{
					logger.info("thats no qti!!!!!");
				}
				
			} catch (Exception e) {
				e.printStackTrace();
			}
		}
	}
	
	private void processMoodle(InputStream is, ContentReader contentreader, NodeRef actionedUponNodeRef){
		RessourceInfoTool ressourceInfoTool = new RessourceInfoTool();
		Document doc = ressourceInfoTool.loadFromStream(is);
		if ((contentreader.getMimetype().equals("application/zip") || contentreader.getMimetype().equals("application/save-as") || contentreader.getMimetype().equals("application/x-zip-compressed")) && doc != null) {
			try {
				
				XPathFactory pfactory = XPathFactory.newInstance();
				XPath xpath = pfactory.newXPath();
				//String schemaPath = 
				String schemaVersPath = "/MOODLE_BACKUP/INFO/MOODLE_RELEASE";
				String schemaVers = (String) xpath.evaluate(schemaVersPath, doc, XPathConstants.STRING);
				if(schemaVers != null && !schemaVers.equals("")){
					if (this.nodeService.hasAspect(actionedUponNodeRef, QName.createQName(CCM_ASPECT_RESSOURCEINFO)) == false)
			        {
			            this.nodeService.addAspect(actionedUponNodeRef, QName.createQName(CCM_ASPECT_RESSOURCEINFO), null);
			        }
					
					nodeService.setProperty(actionedUponNodeRef, QName.createQName(CCM_PROP_IO_RESSOURCETYPE), "moodle");
					nodeService.setProperty(actionedUponNodeRef, QName.createQName(CCM_PROP_IO_RESSOURCEVERSION), schemaVers);
				}
			}catch(Exception e){
				e.printStackTrace();
			}
		}
	}
	
	private void processMoodle2_0(InputStream is, ContentReader contentreader, NodeRef actionedUponNodeRef){
		Document doc = new RessourceInfoTool().loadFromStream(is);
		if ((contentreader.getMimetype().equals("application/zip") || contentreader.getMimetype().equals("application/save-as") || contentreader.getMimetype().equals("application/x-zip-compressed")) && doc != null) {
			try {
				
				XPathFactory pfactory = XPathFactory.newInstance();
				XPath xpath = pfactory.newXPath();
				//String schemaPath = 
				String schemaVersPath = "/moodle_backup/information/moodle_release";
				String schemaVers = (String) xpath.evaluate(schemaVersPath, doc, XPathConstants.STRING);
				if(schemaVers != null && !schemaVers.equals("")){
					if (this.nodeService.hasAspect(actionedUponNodeRef, QName.createQName(CCM_ASPECT_RESSOURCEINFO)) == false)
			        {
			            this.nodeService.addAspect(actionedUponNodeRef, QName.createQName(CCM_ASPECT_RESSOURCEINFO), null);
			        }
					
					nodeService.setProperty(actionedUponNodeRef, QName.createQName(CCM_PROP_IO_RESSOURCETYPE), "moodle");
					nodeService.setProperty(actionedUponNodeRef, QName.createQName(CCM_PROP_IO_RESSOURCEVERSION), schemaVers);
				}
			}catch(Exception e){
				e.printStackTrace();
			}
		}
	}

	protected void addParameterDefinitions(List<ParameterDefinition> arg0) {
		// TODO Auto-generated method stub

	}

	

	public static void main(String[] args) {
		Document doc = new RessourceInfoTool().loadFromFile("c:/imsmanifest.xml");
		XPathFactory pfactory = XPathFactory.newInstance();
		XPath xpath = pfactory.newXPath();
		String schemaPath = "/manifest/metadata/schema";
		String schemaVersPath = "/manifest/metadata/schemaversion";
		
		
		//watch out for schema stuff
		String schema = null;
		String schemaVers = null;
		try {
			schema = (String) xpath.evaluate(schemaPath, doc, XPathConstants.STRING);
			schemaVers = (String) xpath.evaluate(schemaVersPath, doc, XPathConstants.STRING);
			if(schema == null || schema.trim().equals("") || schemaVers == null || schemaVers.trim().equals("")){
				String spath = "/manifest/organizations/organization[position()=1]/metadata/schema";
				String svpath = "/manifest/organizations/organization[position()=1]/metadata/schemaversion";
				schema = (String) xpath.evaluate(spath, doc, XPathConstants.STRING);
				schemaVers = (String) xpath.evaluate(svpath, doc, XPathConstants.STRING);
			}
			
			logger.info("schema:"+schema);
			logger.info("schemaVers:"+schemaVers);
			System.out.println("schema:" + schema);
			System.out.println("schemaverr:" + schemaVers);
		} catch (Exception e) {
			e.printStackTrace();
		}
		
		//test if it's an qti
		String qtiType = null;
		String qtiVersion = null;
		
		
	}
	

	public NodeService getNodeService() {
		return nodeService;
	}

	public void setNodeService(NodeService nodeService) {
		this.nodeService = nodeService;
	}

	public ContentService getContentService() {
		return contentService;
	}

	public void setContentService(ContentService contentService) {
		this.contentService = contentService;
	}

	public void setActionService(ActionService actionService) {
		this.actionService = actionService;
	}

}
