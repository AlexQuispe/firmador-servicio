// FS-06: lee los datos de cada firma del PDF para mostrarlos. No es una validación (§4).
import forge from 'node-forge';

const BYTE_RANGE = /\/ByteRange\s*\[\s*(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s*\]/g;

// D:AAAAMMDDHHmmSS seguido de Z o de un desfase como -04'00'.
function fechaPdf(valor) {
  const m = /D:(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})(Z|[+-]\d{2}'?\d{2}'?)?/.exec(valor ?? '');
  if (!m) return null;
  const [, anio, mes, dia, hora, minuto, segundo, zona = 'Z'] = m;
  const desfase = zona === 'Z' ? 'Z' : `${zona.slice(0, 3)}:${zona.replace(/'/g, '').slice(3, 5)}`;
  return new Date(`${anio}-${mes}-${dia}T${hora}:${minuto}:${segundo}${desfase}`).toISOString();
}

// El CMS trae la cadena; el certificado del firmante es el que indica el SignerInfo.
function certificadoFirmante(contentsHex) {
  const cms = forge.pkcs7.messageFromAsn1(
    forge.asn1.fromDer(forge.util.hexToBytes(contentsHex), { parseAllBytes: false }),
  );
  const [, identificador] = cms.rawCapture.signerInfos[0].value;
  const serie = forge.util.bytesToHex(identificador.value[1].value);
  return cms.certificates.find((c) => c.serialNumber === serie) ?? cms.certificates[0];
}

export function extraerFirmas(bytes) {
  const texto = bytes.toString('latin1');
  const firmas = new Map();

  for (const coincidencia of texto.matchAll(BYTE_RANGE)) {
    const [inicio1, largo1, inicio2, largo2] = coincidencia.slice(1).map(Number);
    const inicioContents = inicio1 + largo1;
    if (firmas.has(inicioContents)) continue;

    // /Contents ocupa justo el hueco que deja el ByteRange: <hex>.
    const certificado = certificadoFirmante(texto.slice(inicioContents + 1, inicio2 - 1));
    const diccionario = texto.slice(
      texto.lastIndexOf(' obj', coincidencia.index),
      texto.indexOf('endobj', coincidencia.index),
    );

    firmas.set(inicioContents, {
      cubre: inicio2 + largo2,
      firma: {
        titular: certificado.subject.getField('CN')?.value ?? null,
        emisor: certificado.issuer.getField('CN')?.value ?? null,
        serie: certificado.serialNumber,
        vigenciaDesde: certificado.validity.notBefore.toISOString(),
        vigenciaHasta: certificado.validity.notAfter.toISOString(),
        fechaDeclarada: fechaPdf(/\/M\s*\(([^)]*)\)/.exec(diccionario)?.[1]),
        subFilter: /\/SubFilter\s*\/([^\s/<>\[\]()]+)/.exec(diccionario)?.[1] ?? null,
      },
    });
  }

  // De la más antigua a la más reciente: cada firma incremental cubre más bytes.
  return [...firmas.values()].sort((a, b) => a.cubre - b.cubre).map(({ firma }) => firma);
}
