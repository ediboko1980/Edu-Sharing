/**
 * CreateAssociation.java
 *
 * This file was auto-generated from WSDL
 * by the Apache Axis 1.4 Apr 22, 2006 (06:55:48 PDT) WSDL2Java emitter.
 */

package org.edu_sharing.webservices.alfresco.extension;

public class CreateAssociation  implements java.io.Serializable {
    private java.lang.String fromID;

    private java.lang.String toID;

    private java.lang.String association;

    public CreateAssociation() {
    }

    public CreateAssociation(
           java.lang.String fromID,
           java.lang.String toID,
           java.lang.String association) {
           this.fromID = fromID;
           this.toID = toID;
           this.association = association;
    }


    /**
     * Gets the fromID value for this CreateAssociation.
     * 
     * @return fromID
     */
    public java.lang.String getFromID() {
        return fromID;
    }


    /**
     * Sets the fromID value for this CreateAssociation.
     * 
     * @param fromID
     */
    public void setFromID(java.lang.String fromID) {
        this.fromID = fromID;
    }


    /**
     * Gets the toID value for this CreateAssociation.
     * 
     * @return toID
     */
    public java.lang.String getToID() {
        return toID;
    }


    /**
     * Sets the toID value for this CreateAssociation.
     * 
     * @param toID
     */
    public void setToID(java.lang.String toID) {
        this.toID = toID;
    }


    /**
     * Gets the association value for this CreateAssociation.
     * 
     * @return association
     */
    public java.lang.String getAssociation() {
        return association;
    }


    /**
     * Sets the association value for this CreateAssociation.
     * 
     * @param association
     */
    public void setAssociation(java.lang.String association) {
        this.association = association;
    }

    private java.lang.Object __equalsCalc = null;
    public synchronized boolean equals(java.lang.Object obj) {
        if (!(obj instanceof CreateAssociation)) return false;
        CreateAssociation other = (CreateAssociation) obj;
        if (obj == null) return false;
        if (this == obj) return true;
        if (__equalsCalc != null) {
            return (__equalsCalc == obj);
        }
        __equalsCalc = obj;
        boolean _equals;
        _equals = true && 
            ((this.fromID==null && other.getFromID()==null) || 
             (this.fromID!=null &&
              this.fromID.equals(other.getFromID()))) &&
            ((this.toID==null && other.getToID()==null) || 
             (this.toID!=null &&
              this.toID.equals(other.getToID()))) &&
            ((this.association==null && other.getAssociation()==null) || 
             (this.association!=null &&
              this.association.equals(other.getAssociation())));
        __equalsCalc = null;
        return _equals;
    }

    private boolean __hashCodeCalc = false;
    public synchronized int hashCode() {
        if (__hashCodeCalc) {
            return 0;
        }
        __hashCodeCalc = true;
        int _hashCode = 1;
        if (getFromID() != null) {
            _hashCode += getFromID().hashCode();
        }
        if (getToID() != null) {
            _hashCode += getToID().hashCode();
        }
        if (getAssociation() != null) {
            _hashCode += getAssociation().hashCode();
        }
        __hashCodeCalc = false;
        return _hashCode;
    }

    // Type metadata
    private static org.apache.axis.description.TypeDesc typeDesc =
        new org.apache.axis.description.TypeDesc(CreateAssociation.class, true);

    static {
        typeDesc.setXmlType(new javax.xml.namespace.QName("http://extension.alfresco.webservices.edu_sharing.org", ">createAssociation"));
        org.apache.axis.description.ElementDesc elemField = new org.apache.axis.description.ElementDesc();
        elemField.setFieldName("fromID");
        elemField.setXmlName(new javax.xml.namespace.QName("http://extension.alfresco.webservices.edu_sharing.org", "fromID"));
        elemField.setXmlType(new javax.xml.namespace.QName("http://www.w3.org/2001/XMLSchema", "string"));
        elemField.setNillable(false);
        typeDesc.addFieldDesc(elemField);
        elemField = new org.apache.axis.description.ElementDesc();
        elemField.setFieldName("toID");
        elemField.setXmlName(new javax.xml.namespace.QName("http://extension.alfresco.webservices.edu_sharing.org", "toID"));
        elemField.setXmlType(new javax.xml.namespace.QName("http://www.w3.org/2001/XMLSchema", "string"));
        elemField.setNillable(false);
        typeDesc.addFieldDesc(elemField);
        elemField = new org.apache.axis.description.ElementDesc();
        elemField.setFieldName("association");
        elemField.setXmlName(new javax.xml.namespace.QName("http://extension.alfresco.webservices.edu_sharing.org", "association"));
        elemField.setXmlType(new javax.xml.namespace.QName("http://www.w3.org/2001/XMLSchema", "string"));
        elemField.setNillable(false);
        typeDesc.addFieldDesc(elemField);
    }

    /**
     * Return type metadata object
     */
    public static org.apache.axis.description.TypeDesc getTypeDesc() {
        return typeDesc;
    }

    /**
     * Get Custom Serializer
     */
    public static org.apache.axis.encoding.Serializer getSerializer(
           java.lang.String mechType, 
           java.lang.Class _javaType,  
           javax.xml.namespace.QName _xmlType) {
        return 
          new  org.apache.axis.encoding.ser.BeanSerializer(
            _javaType, _xmlType, typeDesc);
    }

    /**
     * Get Custom Deserializer
     */
    public static org.apache.axis.encoding.Deserializer getDeserializer(
           java.lang.String mechType, 
           java.lang.Class _javaType,  
           javax.xml.namespace.QName _xmlType) {
        return 
          new  org.apache.axis.encoding.ser.BeanDeserializer(
            _javaType, _xmlType, typeDesc);
    }

}
